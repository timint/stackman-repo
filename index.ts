import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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

await (async function loadInstanceModules() {
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
export async function generateFeeds() {
	const results: Record<string, any> = {};
	const successCount: Record<string, number> = {};
	const errorCount: Record<string, number> = {};

	console.log('🔄 Fetching releases from all sources...\n');

	await Promise.all(
		Object.entries(releaseFetchers).map(async ([name, fn]) => {
			try {
				results[name] = await fn();
				successCount[name] = 1;
				process.stdout.write('.');
			} catch (e) {
				results[name] = { error: (e as Error).message };
				errorCount[name] = 1;
				process.stdout.write('✗');
			}
		})
	);

	console.log('\n');

	console.log(`📊 Fetch Summary:`);
	console.log(`  ✓ Success: ${Object.keys(successCount).length} apps`);
	console.log(`  ✗ Errors: ${Object.keys(errorCount).length} apps\n`);

	if (Object.keys(errorCount).length > 0) {
		console.log('❌ Failed apps:');
		for (const [name] of Object.entries(errorCount)) {
			console.log(`  - ${name}: ${(results[name] as any).error}`);
		}
		console.log();
	}

	// Filter to keep only latest release for each era
	console.log('🔍 Filtering to latest release per era...\n');
	for (const key in results) {
		if (Array.isArray(results[key])) {
			const eraMap = new Map<string, any>();
			for (const release of results[key]) {
				const current = eraMap.get(release.era);
				if (!current || compareVersions(release.version, current.version) > 0) {
					eraMap.set(release.era, release);
				}
			}
			results[key] = Array.from(eraMap.values());
		}
	}

	// Sort results by key (module name) ascending
	const sortedResults: Record<string, any> = {};
	Object.keys(results).sort().forEach(key => {
		sortedResults[key] = results[key];
		if (Array.isArray(sortedResults[key])) {
			sortedResults[key].sort((a: any, b: any) => a.name.localeCompare(b.name));
		}
	});

	// Print summary
	console.log('📋 Final Summary:');
	let totalReleases = 0;
	for (const [key, value] of Object.entries(sortedResults)) {
		if (Array.isArray(value)) {
			totalReleases += value.length;
			console.log(`  ${key}: ${value.length} release(s)`);
		} else {
			console.log(`  ${key}: ERROR`);
		}
	}
	console.log(`\n  Total releases: ${totalReleases}\n`);

	return sortedResults;
}

// Execute the feed generation when run directly
generateFeeds().then((results) => {

	// Write results to JSON file
	const feedPath = join(appsDir, '..', 'public', 'app-releases.json');
	Bun.write(feedPath, JSON.stringify(results, null, '\t'));

	console.log('Feed generated successfully at public/app-releases.json');
}).catch((error) => {
	console.error('Error generating feed:', error);
	process.exit(1);
});
