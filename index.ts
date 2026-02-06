import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

type ReleaseFetcher = () => Promise<any[]>;

const appsDir = join(dirname(fileURLToPath(import.meta.url)), 'apps');

export const releaseFetchers: Record<string, ReleaseFetcher> = {};

await (async function loadInstanceModules() {
  const files = await readdir(appsDir);
  const tsFiles = files.filter(file => file.endsWith('.ts') && file !== 'index.ts');

  for (const file of tsFiles) {
    const moduleName = file.replace('.ts', '');
    const modulePath = `./apps/${moduleName}`;
    const module = await import(modulePath);
    if (module.getReleases) {
      releaseFetchers[moduleName] = module.getReleases;
    }
  }
})();

// Example: fetch all
export async function generateFeeds() {
  const results: Record<string, any> = {};

  await Promise.all(
    Object.entries(releaseFetchers).map(async ([name, fn]) => {
      try {
        results[name] = await fn();
      } catch (e) {
        results[name] = { error: (e as Error).message };
      }
    })
  );

  // Filter to keep only latest release for each era
  for (const key in results) {
    if (Array.isArray(results[key])) {
      const eraMap = new Map<string, any>();
      for (const release of results[key]) {
        const current = eraMap.get(release.era);
        if (!current || release.version.localeCompare(current.version, undefined, { numeric: true }) > 0) {
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
