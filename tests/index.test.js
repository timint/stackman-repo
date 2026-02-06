import { test, expect, describe } from 'bun:test';
import { generateFeeds } from '../index';
import { readFileSync } from 'fs';

const apps = [
	'apache', 'php', 'mariadb', 'mysql', 'nginx',
	'nodejs', 'python', 'postgresql', 'mongodb', 'bun',
	'caddy', 'go', 'ruby', 'dlang', 'dotnet',
	'kotlin', 'java', 'perl', 'scala', 'swift',
	'zig'
];

async function testUrl(url, key, version, platform) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) {
      console.log(`FAIL: ${key} ${version} ${platform}`);
      console.log(`  URL: ${url}`);
      console.log(`  Status: ${response.status}`);
      return { success: false, status: response.status };
    }
    return { success: true, status: response.status };
  } catch (error) {
    console.log(`ERROR: ${key} ${version} ${platform}`);
    console.log(`  URL: ${url}`);
    console.log(`  Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

describe('Release feeds', () => {
  test('should fetch all available releases and return arrays of releases', { timeout: 120000 }, async () => {

		const results = await generateFeeds();

		// Check that all expected keys exist and are arrays (or error objects)
		for (const key of apps) {
			expect(results).toHaveProperty(key);

			// Accept either array (success) or object with error property
			const val = results[key];
			if (Array.isArray(val)) {
				expect(val.length).toBeGreaterThanOrEqual(0);

				// Optionally check shape of first element if present
				if (val.length > 0) {
					expect(val[0]).toHaveProperty('name');
					expect(val[0]).toHaveProperty('version');
				}

			} else {
				expect(val).toHaveProperty('error');
			}
		}

		// Check if file exists and content matches results
		const fileContent = readFileSync(`./public/app-releases.json`, 'utf-8');
		const fileResults = JSON.parse(fileContent);
		expect(fileResults).toEqual(results);
  });

	test('should have all urls in app-releases.json resolve ok', { timeout: 120000 }, async () => {
		const results = readFileSync('./public/app-releases.json', 'utf-8');
		const appReleases = JSON.parse(results);
		const failures = [];

		// Check that all expected keys exist and are arrays (or error objects)
		for (const app of Object.keys(appReleases)) {
			expect(appReleases).toHaveProperty(app);

			// Accept either array (success) or object with error property
			const val = appReleases[app];
			if (Array.isArray(val)) {
				expect(val.length).toBeGreaterThanOrEqual(0);

				// Test using testUrl for each platform
				for (const release of val) {
					for (const platform of release.platforms) {
						const testResult = await testUrl(platform.url, app, release.version, platform.platform);
						if (!testResult.success) {
							failures.push({
								app,
								version: release.version,
								platform: platform.platform,
								url: platform.url
							});
							break;
						}
					}
				}

				expect(failures.length).toBe(0);

			} else {
				expect(val).toHaveProperty('error');
			}
		}

    // Print summary
    console.log(`\n\nTotal failures: ${failures.length}`);
    if (failures.length > 0) {
      console.log('\nFailed URLs:');
      for (const failure of failures) {
        console.log(`  ${failure.app} ${failure.version} ${failure.platform}: ${failure.url}`);
      }
    } else {
      console.log('\nAll URLs resolved successfully!');
    }
  });
});
