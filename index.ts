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

  // Sort results by key (module name) ascending
  const sortedResults: Record<string, any> = {};
  Object.keys(results).sort().forEach(key => {
    sortedResults[key] = results[key];
    if (Array.isArray(sortedResults[key])) {
      sortedResults[key].sort((a: any, b: any) => a.name.localeCompare(b.name));
    }
  });

  // Write results to JSON file
  let feed = join(appsDir, '..', 'public', 'app-releases.json');
  await Bun.write(feed, JSON.stringify(sortedResults, null, 2));

  return sortedResults;
}

// Execute the feed generation when run directly
generateFeeds().then(() => {
  console.log('Feed generated successfully at public/app-releases.json');
}).catch((error) => {
  console.error('Error generating feed:', error);
  process.exit(1);
});
