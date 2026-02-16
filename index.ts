/// <reference types="bun" />

import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PlatformTarget } from './types/release';

type ReleaseFetcher = () => Promise<any[]>;

const appsDir = join(dirname(fileURLToPath(import.meta.url)), 'apps');

export function compareVersions(a: string, b: string): number {
	const cleanA = a.replace(/^v/, '');
	const cleanB = b.replace(/^v/, '');

	const partsA = cleanA.split('.').map(part => {
		const num = parseInt(part, 10);
		return isNaN(num) ? part : num;
	});

	const partsB = cleanB.split('.').map(part => {
		const num = parseInt(part, 10);
		return isNaN(num) ? part : num;
	});

	for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
		const partA = partsA[i] ?? 0;
		const partB = partsB[i] ?? 0;

		if (typeof partA === 'number' && typeof partB === 'number') {
			if (partA !== partB) {
				return partA - partB;
			}
		} else {
			const strA = String(partA);
			const strB = String(partB);
			const cmp = strA.localeCompare(strB);
			if (cmp !== 0) {
				return cmp;
			}
		}
	}

	return 0;
}

export const releaseFetchers: Record<string, ReleaseFetcher> = {};

await (async function loadReleaseFetchers() {
	const files = await readdir(appsDir);
	const tsFiles = files.filter(file => file.endsWith('.ts') && file !== 'index.ts');

	console.log(`\n📦 Loading ${tsFiles.length} release fetchers from apps/ directory...\n`);

	for (const file of tsFiles) {
		const moduleName = file.replace('.ts', '');
		const modulePath = `./apps/${moduleName}`;
		const module = await import(modulePath);
		if (module.getReleases) {
			releaseFetchers[moduleName] = module.getReleases;
		}
	}

	console.log(`✓ Loaded ${Object.keys(releaseFetchers).length} release fetchers: ${Object.keys(releaseFetchers).join(', ')}\n`);
})();

// Example: fetch all
export async function generateFeeds(targetApp?: string) {
	const results: Record<string, any> = {};
	const successCount: Record<string, number> = {};
	const errorCount: Record<string, number> = {};

	const fetchersToUse = targetApp
		? [[targetApp, releaseFetchers[targetApp]] as const].filter(([, fn]) => fn)
		: Object.entries(releaseFetchers);

	console.log(`🔄 Fetching releases from ${targetApp ? targetApp : 'all sources'}...\n`);

	await Promise.all(
		fetchersToUse.map(async ([name, fn]) => {
			const start = Date.now();
			try {
				results[name] = await fn();
				const duration = Date.now() - start;
				successCount[name] = 1;
				process.stdout.write(`✅ ${name} [${duration.toLocaleString()} ms] ${results[name].length} release(s)\n`);
			} catch (e) {
				const duration = Date.now() - start;
				results[name] = [];
				errorCount[name] = 1;
				process.stdout.write(`❌ ${name} [${duration.toLocaleString()} ms] Error: ${(e as Error).message}\n`);
			}
		})
	);

	console.log('\n');

	console.log(`📊 Fetch Summary:`);
	console.log(`  ✓ Success: ${Object.keys(successCount).length} apps`);
	console.log(`  ✗ Errors: ${Object.keys(errorCount).length} apps\n`);

	// Sort results by key (module name) ascending
	console.log('📱Sorting results...\n');
	const sortedResults: Record<string, any> = {};
	Object.keys(results).sort().forEach(key => {
		sortedResults[key] = results[key];
		if (Array.isArray(sortedResults[key])) {
			sortedResults[key].sort((a: any, b: any) => a.name.localeCompare(b.name));
		}
	});

	// Filter to only target app if specified
	const finalResults = targetApp
		? { [targetApp]: sortedResults[targetApp] }
		: sortedResults;

	// Test targets for every release
	for (const [key, value] of Object.entries(finalResults)) {
		if (Array.isArray(value)) {
			for (const release of value) {
				if (!release.platforms || release.platforms.length === 0) {
					console.warn(`⚠️ Release ${release.id} has no platforms!`);
					continue;
				}
				// Check if all targets are present
				const allTargets = [
					PlatformTarget.linux_amd64,
					PlatformTarget.linux_arm64,
					PlatformTarget.macos_amd64,
					PlatformTarget.macos_arm64,
					PlatformTarget.windows_amd64,
				];
				const presentTargets = release.platforms.map(platform => platform.target);
				const missingTargets = allTargets.filter(target => !presentTargets.includes(target));
				if (missingTargets.length > 0) {
					console.warn(`⚠️ Release ${release.id} is missing targets: ${missingTargets.join(', ')}!`);
					continue;
				}
				// Check if all targets have a valid url
				for (const platform of release.platforms) {
					if (!platform.url) {
						console.warn(`⚠️ Release ${release.id} has no url for target ${platform.target}!`);
						continue;
					}
					// Test if url is reachable with HEAD
					try {
						const res = await fetch(platform.url, { method: 'HEAD' });
						if (!res.ok) {
							console.warn(`⚠️ Release ${release.id} has unreachable target ${platform.target} with url ${platform.url} (${res.status} ${res.statusText})!`);
							continue;
						}
					} catch (e) {
						console.warn(`⚠️ Release ${release.id} has unreachable target ${platform.target} with url ${platform.url} (${(e as Error).message})!`);
						continue;
					}
					console.log(`✅ Release ${release.id} has reachable target ${platform.target} with url ${platform.url}!`);
				}
			}
		}
	}

	// Print summary
	console.log('\n📋 Final Summary:');
	let totalReleases = 0;
	for (const [key, value] of Object.entries(finalResults)) {
		if (Array.isArray(value)) {
			totalReleases += value.length;
		}
	}
	console.log(`\n  Total releases: ${totalReleases}\n`);

	return finalResults;
}

// Execute the feed generation when run directly
// Run only if this is the main entry (works for Bun and Node.js, including after bun build)
const isMain = (() => {
	// Bun: process.argv[1] is the entry file, import.meta.path is the file path
	// Node: import.meta.url is file://... and process.argv[1] is the entry file
	const entry = process.argv[1] ? fileURLToPath(`file://${process.argv[1]}`) : '';
	const current = fileURLToPath(import.meta.url);
	return entry && current && entry === current;
})();

if (isMain) {
	generateFeeds().then((results) => {
		// Write results to JSON file
		const feedPath = join(appsDir, '..', 'public', 'app-releases.json');
		Bun.write(feedPath, JSON.stringify(results, null, '\t'));
		console.log('Feed generated successfully at public/app-releases.json');
	}).catch((error) => {
		console.error('Error generating feed:', error);
		process.exit(1);
	});
}
