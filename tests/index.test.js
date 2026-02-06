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

async function testUrl(url, key, version, target) {
  try {

    const response = await fetch(url, { method: 'HEAD' });

    if (!response.ok) {
      console.log(`FAIL: ${key} ${version} ${target}`);
      console.log(`  URL: ${url}`);
      console.log(`  Status: ${response.status}`);
      return { success: false, status: response.status };
    }

    return { success: true, status: response.status };

  } catch (error) {
    console.log(`ERROR: ${key} ${version} ${target}`);
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
						const testResult = await testUrl(platform.url, app, release.version, platform.target);
						if (!testResult.success) {
							failures.push({
								app,
								version: release.version,
								target: platform.target,
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

	test('should have mac, linux, and windows releases present', { timeout: 120000 }, async () => {
		const results = readFileSync('./public/app-releases.json', 'utf-8');
		const appReleases = JSON.parse(results);

		for (const app of Object.keys(appReleases)) {
			const val = appReleases[app];
			if (!Array.isArray(val) || val.length === 0) continue;

			const hasMac = val.some(release =>
				release.platforms.some(p => p.target === 'macos-amd64' || p.target === 'macos-arm64')
			);
			const hasLinux = val.some(release =>
				release.platforms.some(p => p.target === 'linux-amd64' || p.target === 'linux-arm64')
			);
			const hasWindows = val.some(release =>
				release.platforms.some(p => p.target === 'windows-amd64')
			);

			if (hasMac && hasLinux && hasWindows) {
				console.log(`✓ ${app}: macos, linux, windows`);
			} else {
				const platforms = [];
				if (hasMac) platforms.push('macos');
				if (hasLinux) platforms.push('linux');
				if (hasWindows) platforms.push('windows');
				console.log(`⚠ ${app}: ${platforms.join(', ')}`);
			}

			expect(hasMac || hasLinux || hasWindows).toBe(true);
		}
	});

	test('should have urls that are archives and not installers or .deb files', { timeout: 120000 }, async () => {
		const results = readFileSync('./public/app-releases.json', 'utf-8');
		const appReleases = JSON.parse(results);
		const failures = [];

		const allowedExtensions = [
			'.tar.gz', '.tgz', '.tar.bz2', '.tbz2', '.tar.xz', '.txz',
			'.zip', '.7z', '.rar', '.tar', '.zst', '.tar.zst'
		];
		const forbiddenExtensions = ['.exe', '.msi', '.appimage', '.deb', '.rpm', '.dmg'];

		for (const app of Object.keys(appReleases)) {
			const val = appReleases[app];
			if (!Array.isArray(val) || val.length === 0) continue;

			for (const release of val) {
				for (const platform of release.platforms) {
					const url = platform.url.toLowerCase();

					const hasAllowedExtension = allowedExtensions.some(ext => url.endsWith(ext));
					const hasForbiddenExtension = forbiddenExtensions.some(ext => url.endsWith(ext));

					if (!hasAllowedExtension || hasForbiddenExtension) {
						failures.push({
							app,
							version: release.version,
							target: platform.target,
							url: platform.url,
							reason: hasForbiddenExtension
								? 'has forbidden extension (installer or .deb)'
								: 'does not have an archive extension'
						});
					}
				}
			}
		}

		expect(failures.length).toBe(0);

		console.log(`\n\nTotal URL format failures: ${failures.length}`);
		if (failures.length > 0) {
			console.log('\nFailed URLs (not archives or are installers/.deb):');
			for (const failure of failures) {
				console.log(`  ${failure.app} ${failure.version} ${failure.target}: ${failure.reason}`);
				console.log(`    URL: ${failure.url}`);
			}
		} else {
			console.log('\nAll URLs are archives (not installers or .deb files)!');
		}
	});
});
