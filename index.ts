import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const PLATFORMS = ['linux-amd64', 'linux-arm64', 'macos-amd64', 'macos-arm64', 'windows-amd64'] as const;
type Platform = typeof PLATFORMS[number];

type ReleaseFetcher = () => Promise<any[]>;
type Release = { url?: string; target?: string; id: string; name: string };

const appsDir = join(dirname(fileURLToPath(import.meta.url)), 'fetchers', 'apps');

export const releaseFetchers: Record<string, ReleaseFetcher> = {};

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

function matchesWildcard(pattern: string, text: string): boolean {
	return new RegExp(`.*${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*`, 'i').test(text);
}

function getFilterPattern(): string | null {
	const args = process.argv.slice(2);
	return args.length ? args[args.length - 1] : null;
}

function getPlatform(key: string): Platform | null {
	return PLATFORMS.find(p => key.endsWith(p)) ?? null;
}

function mapToPlatformFeeds(results: Record<string, any>): Record<Platform, Record<string, any>> {
	const feeds: Record<Platform, Record<string, any>> = {} as any;
	PLATFORMS.forEach(p => feeds[p] = {});

	for (const [key, value] of Object.entries(results)) {
		if (Array.isArray(value)) {
			const platform = getPlatform(key);
			if (platform) {
				feeds[platform][key.split('-')[0]] = value.sort((a: Release, b: Release) => a.name.localeCompare(b.name));
			}
		}
	}

	return feeds;
}

async function loadFeeds(feedsDir: string): Record<Platform, Record<string, any>> {
	const feeds: Record<Platform, Record<string, any>> = {} as any;

	await Promise.all(PLATFORMS.map(async platform => {
		try {
			feeds[platform] = JSON.parse(await readFile(join(feedsDir, `${platform}.json`), 'utf-8'));
		} catch {
			feeds[platform] = {};
		}
	}));

	return feeds;
}

async function validateUrls(results: Record<string, any>): Promise<void> {
	for (const [key, releases] of Object.entries(results)) {
		for (const release of releases ?? []) {
			try {

				if (!release.url || !release.target) {
					throw new Error(`Missing url or target`);
				}

				const res = await fetch(release.url, { method: 'HEAD' });

				if (!res.ok) {
					throw new Error(`${release.url}: ${res.status} ${res.statusText}`);
				}

				if (!release.url.match(/\.(7z|tar(\.gz|\.xz)?|tgz|zip)$/)) {
				throw new Error(`Package is not an archive: ${release.url}`);
			}

				console.log(`✅  ${release.id} (${release.target}): OK`);

			} catch (e) {
				console.warn(`⚠️  ${release.id} (${release.target}): ${(e as Error).message}`);
			}
		}
	}
}

await (async function loadFetchers() {
	const appDirs = await readdir(appsDir, { withFileTypes: true });
	const appNames = appDirs.filter(d => d.isDirectory()).map(d => d.name);

	for (const appName of appNames) {
		const platformFiles = await readdir(join(appsDir, appName));
		for (const file of platformFiles.filter(f => f.endsWith('.ts'))) {
			const module = await import(`./fetchers/apps/${appName}/${file}`);
			if (module.getReleases) {
				const platform = file.replace('.ts', '').replace(`${appName}-`, '');
				releaseFetchers[`${appName}-${platform}`] = module.getReleases;
			}
		}
	}

	console.log(`✓ Loaded ${Object.keys(releaseFetchers).length} release fetchers\n`);
})();

export async function generateFeeds(filterPattern?: string): Promise<Record<string, any>> {
	const filtered = Object.entries(releaseFetchers).filter(([key]) => !filterPattern || matchesWildcard(filterPattern, key));

	if (!filtered.length) {
		console.log(`❌ No fetchers matching: ${filterPattern}`);
		return {};
	}

	console.log(`🔄 Fetching from ${filtered.length} fetchers...\n`);

	const results: Record<string, any> = {};
	let success = 0;

	await Promise.all(filtered.map(async ([name, fn]) => {
		const start = Date.now();
		try {
			results[name] = await fn();
			success++;
			console.log(`✅ ${name} [${Date.now() - start}ms] ${results[name].length} releases`);
		} catch (e) {
			results[name] = [];
			console.log(`❌ ${name} [${Date.now() - start}ms] ${(e as Error).message}`);
		}
	}));

	console.log(`\n📊 Success: ${success} | Errors: ${filtered.length - success}\n`);

	console.log(`🔍 Validating ${filterPattern ? 'fetched' : 'all'} URLs...\n`);
	await validateUrls(results);

	const total = Object.values(results).flat().length;
	console.log(`\n📋 Total releases: ${total}\n`);

	return results;
}

const isMain = process.argv[1] ? fileURLToPath(`file://${process.argv[1]}`) === fileURLToPath(import.meta.url) : false;

if (isMain) {
	const filter = getFilterPattern();
	const feedsDir = join(dirname(fileURLToPath(import.meta.url)), 'public', 'apps');

	generateFeeds(filter).then(async results => {
		let platformFeeds = mapToPlatformFeeds(results);

		if (filter) {
			console.log('📖 Merging with existing feeds...\n');
			const existing = await loadFeeds(feedsDir);
			for (const platform of PLATFORMS) {
				platformFeeds[platform] = { ...existing[platform], ...platformFeeds[platform] };
			}
		}

		for (const platform of PLATFORMS) {
			// Sort keys ascending
			platformFeeds[platform] = Object.fromEntries(Object.entries(platformFeeds[platform]).sort(([a], [b]) => a.localeCompare(b)));

			for (const app of Object.keys(platformFeeds[platform])) {
				platformFeeds[platform][app].sort((a: Release, b: Release) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true }));
			}
		}

		await Promise.all(PLATFORMS.map(platform =>
			Bun.write(join(feedsDir, `${platform}.json`), JSON.stringify(platformFeeds[platform], null, '\t'))
		));

		console.log('\n✓ Feeds written to public/apps/');
	}).catch(e => {
		console.error('Error:', e);
		process.exit(1);
	});
}
