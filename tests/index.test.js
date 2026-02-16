import { test, expect, describe } from 'bun:test';
import { generateFeeds } from '../index';

const apps = [
	'apache', 'php', 'mariadb', 'mysql', 'nginx',
	'nodejs', 'python', 'postgresql', 'mongodb',
	 'bun', 'caddy', 'go', 'ruby', 'dlang',
	 'kotlin', 'java', 'perl', 'scala', 'zig'
];

const targetApp = process.env.TEST_APP || process.argv[2];

if (targetApp && !apps.includes(targetApp)) {
	console.error(`Unknown app: ${targetApp}`);
	console.error(`Available apps: ${apps.join(', ')}`);
	process.exit(1);
}

if (targetApp) {
	console.log(`\n🔍 Running tests for specific app: ${targetApp}\n`);
}

let appReleases = null;

async function testUrl(url, key, version, target) {
	try {
		const start = Date.now();
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000);
		const response = await fetch(url, { method: 'HEAD', signal: controller.signal });
		clearTimeout(timeoutId);
		const duration = Date.now() - start;
		if (!response.ok) {
			console.log(`FAIL: ${key} ${version} ${target}`);
			console.log(`  URL: ${url}`);
			console.log(`  Status: ${response.status}`);
			console.log(`  Duration: ${duration}ms`);
			return { success: false, status: response.status, duration };
		}
		console.log(`OK: ${key} ${version} ${target} [${duration}ms]`);
		return { success: true, status: response.status, duration };
	} catch (error) {
		const duration = Date.now() - start;
		console.log(`ERROR: ${key} ${version} ${target}`);
		console.log(`  URL: ${url}`);
		console.log(`  Error: ${error.name === 'AbortError' ? 'Timeout (10s)' : error.message}`);
		console.log(`  Duration: ${duration}ms`);
		return { success: false, error: error.name === 'AbortError' ? 'TIMEOUT' : error.message, duration };
	}
}

describe('Release feeds', () => {
  test('should fetch all available releases and return arrays of releases', { timeout: 60e3 }, async () => {

		const results = await generateFeeds(targetApp);

		const appsToTest = targetApp ? [targetApp] : apps;

		expect(Object.keys(results).length).toBeGreaterThanOrEqual(0);

		// Check that all expected keys exist and are arrays (or error objects)
		for (const key of appsToTest) {
			expect(results).toHaveProperty(key);
		}

		for (const app of appsToTest) {
			const appReleases = results[app];

			// Accept either array (success) or object with error property
			expect(appReleases.length).toBeGreaterThanOrEqual(0);

			for (const release of appReleases) {
				expect(release).toHaveProperty('id');
				expect(release).toHaveProperty('version');
				expect(release).toHaveProperty('platforms');
				expect(release).toHaveProperty('era');

				expect(release.id).toBe(`${app}-${release.era}`);
				expect(release.version.match(/^\d+(\.\d+)*([+\-][a-zA-Z0-9.-]+)?$/)).toBeTruthy();
				expect(release.era.match(/^[0-9.]+$/)).toBeTruthy();

				for (const platform of release.platforms) {
					expect(platform).toHaveProperty('target');
					expect(platform).toHaveProperty('url');
				}
			}
		}

		// Store results for use in other tests
		// If a specific app is targeted, filter the results to only that app
		if (targetApp) {
			appReleases = { [targetApp]: results[targetApp] };
		} else {
			appReleases = results;
		}
  });

	test('should have all urls in app-releases.json resolve ok', { timeout: 120000 }, async () => {
		if (!appReleases) {
			appReleases = await generateFeeds(targetApp);
		}
		const appsToTest = targetApp ? [targetApp] : Object.keys(appReleases);
		const failures = [];
		const durations = [];
		const overallStart = Date.now();

		// Check that all expected keys exist and are arrays (or error objects)
		for (const app of appsToTest) {
			expect(appReleases).toHaveProperty(app);

			const val = appReleases[app];

			if (Array.isArray(val)) {
				expect(val.length).toBeGreaterThanOrEqual(0);

				expect(val).not.toHaveProperty('error');

				// Test using testUrl for each platform
				for (const release of val) {
					expect(release).toHaveProperty('version');
					expect(release).toHaveProperty('platforms');

					for (const platform of release.platforms) {
						const testResult = await testUrl(platform.url, app, release.version, platform.target);

						durations.push({
							app,
							version: release.version,
							target: platform.target,
							url: platform.url,
							duration: testResult.duration
						});

						if (!testResult.success) {
							failures.push({
								app,
								version: release.version,
								target: platform.target,
								url: platform.url,
								status: testResult.status || 'ERROR',
								duration: testResult.duration
							});

							break;
						}
					}
				}
			}
		}

		expect(failures.length).toBe(0);

		// Print summary
		const overallDuration = Date.now() - overallStart;

		console.log(`\n\nTotal failures: ${failures.length}`);

		if (failures.length > 0) {

			console.log('\nFailed URLs:');

			for (const failure of failures) {
				console.log(`  ${failure.app} ${failure.version} ${failure.target}: HTTP ${failure.status} [${failure.duration}ms]`);
				console.log(`    URL: ${failure.url}`);
			}

		} else {
			console.log('\nAll URLs resolved successfully!');
		}

		// Print duration stats
		console.log(`\nDuration stats for each URL:`);

		for (const d of durations) {
			console.log(`  ${d.app} ${d.version} ${d.target}: ${d.url} [${d.duration}ms]`);
		}

		console.log(`\nOverall test duration: ${overallDuration}ms`);
  });

	test('should have mac, linux, and windows releases present', { timeout: 120000 }, async () => {
		if (!appReleases) {
			appReleases = await generateFeeds(targetApp);
		}

		const appsToTest = targetApp ? [targetApp] : Object.keys(appReleases);

		for (const app of appsToTest) {
			const val = appReleases[app];
			if (!Array.isArray(val) || val.length === 0) continue;

			const hasMacAmd64 = val.some(release =>
				release.platforms.some(p => p.target === 'macos-amd64')
			);
			const hasMacArm64 = val.some(release =>
				release.platforms.some(p => p.target === 'macos-arm64')
			);
			const hasMac = hasMacAmd64 && hasMacArm64;

			const hasLinuxAmd64 = val.some(release =>
				release.platforms.some(p => p.target === 'linux-amd64')
			);
			const hasLinuxArm64 = val.some(release =>
				release.platforms.some(p => p.target === 'linux-arm64')
			);
			const hasLinux = hasLinuxAmd64 && hasLinuxArm64;

			const hasWindows = val.some(release =>
				release.platforms.some(p => p.target === 'windows-amd64')
			);

			if (hasMac && hasLinux && hasWindows) {
				console.log(`✓ ${app}: macos (amd64+arm64), linux (amd64+arm64), windows`);
			} else {
				const platforms = [];
				if (hasMacAmd64 && hasMacArm64) platforms.push('macos (amd64+arm64)');
				else if (hasMacAmd64) platforms.push('macos (amd64 only)');
				else if (hasMacArm64) platforms.push('macos (arm64 only)');
				if (hasLinuxAmd64 && hasLinuxArm64) platforms.push('linux (amd64+arm64)');
				else if (hasLinuxAmd64) platforms.push('linux (amd64 only)');
				else if (hasLinuxArm64) platforms.push('linux (arm64 only)');
				if (hasWindows) platforms.push('windows');
				console.log(`⚠ ${app}: ${platforms.join(', ')}`);
			}

			if (app === 'apache' || app === 'dlang') {
				expect(hasLinuxAmd64).toBe(true);
				expect(hasMacAmd64).toBe(true);
				expect(hasWindows).toBe(true);
			} else {
				expect(hasLinux).toBe(true);
				expect(hasMac).toBe(true);
				expect(hasWindows).toBe(true);
			}
  		}
  	});

	test('should have urls that are archives and not installers or .deb files', { timeout: 120000 }, async () => {
		if (!appReleases) {
			appReleases = await generateFeeds();
		}
		const appsToTest = targetApp ? [targetApp] : Object.keys(appReleases);
		const failures = [];

		const allowedExtensions = [
			'.tar.gz', '.tgz', '.tar.bz2', '.tbz2', '.tar.xz', '.txz',
			'.zip', '.7z', '.rar', '.tar', '.zst', '.tar.zst'
		];
		const forbiddenExtensions = ['.exe', '.msi', '.appimage', '.deb', '.rpm', '.dmg'];

		for (const app of appsToTest) {
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

					expect(hasAllowedExtension).toBe(true);
					expect(hasForbiddenExtension).toBe(false);
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
