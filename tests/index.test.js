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

function groupByApp(results) {
	const grouped = {};
	for (const [key, releases] of Object.entries(results)) {
		if (Array.isArray(releases)) {
			const appName = key.split('-')[0];
			if (!grouped[appName]) {
				grouped[appName] = [];
			}
			grouped[appName].push(...releases);
		}
	}
	return grouped;
}

async function testUrl(url, key, version, target) {
	const start = Date.now();
	try {
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
		const grouped = groupByApp(results);

		expect(Object.keys(grouped).length).toBeGreaterThanOrEqual(0);

		// Check that all expected keys exist and are arrays (or error objects)
		for (const key of appsToTest) {
			expect(grouped).toHaveProperty(key);
		}

		for (const app of appsToTest) {
			const appReleases = grouped[app];

			// Accept either array (success) or object with error property
			expect(appReleases.length).toBeGreaterThanOrEqual(0);

			for (const release of appReleases) {
				expect(release).toHaveProperty('id');
				expect(release).toHaveProperty('version');
				expect(release).toHaveProperty('target');
				expect(release).toHaveProperty('url');
				expect(release).toHaveProperty('era');

				expect(release.id).toBe(`${app}-${release.era}`);
				expect(release.version.match(/^\d+(\.\d+)*([+\-][a-zA-Z0-9.-]+)?$/)).toBeTruthy();
				expect(release.era.match(/^[0-9.]+$/)).toBeTruthy();
				expect(release.target).toMatch(/^(linux|macos|windows)-(amd64|arm64)$/);
			}
		}

		// Store results for use in other tests
		// If a specific app is targeted, filter the results to only that app
		if (targetApp) {
			appReleases = { [targetApp]: grouped[targetApp] };
		} else {
			appReleases = grouped;
		}
  });

	test('should have all urls in app-releases.json resolve ok', { timeout: 120000 }, async () => {
		if (!appReleases) {
			const results = await generateFeeds(targetApp);
			appReleases = groupByApp(results);
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

				// Test using testUrl for each release
				for (const release of val) {
					expect(release).toHaveProperty('version');
					expect(release).toHaveProperty('url');
					expect(release).toHaveProperty('target');

					const testResult = await testUrl(release.url, app, release.version, release.target);

					durations.push({
						app,
						version: release.version,
						target: release.target,
						url: release.url,
						duration: testResult.duration
					});

					if (!testResult.success) {
						failures.push({
							app,
							version: release.version,
							target: release.target,
							url: release.url,
							status: testResult.status || 'ERROR',
							duration: testResult.duration
						});
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
			const results = await generateFeeds(targetApp);
			appReleases = groupByApp(results);
		}

		const appsToTest = targetApp ? [targetApp] : Object.keys(appReleases);

		for (const app of appsToTest) {
			const val = appReleases[app];
			if (!Array.isArray(val) || val.length === 0) continue;

			const hasMacAmd64 = val.some(release => release.target === 'macos-amd64');
			const hasMacArm64 = val.some(release => release.target === 'macos-arm64');
			const hasMac = hasMacAmd64 && hasMacArm64;

			const hasLinuxAmd64 = val.some(release => release.target === 'linux-amd64');
			const hasLinuxArm64 = val.some(release => release.target === 'linux-arm64');
			const hasLinux = hasLinuxAmd64 && hasLinuxArm64;

			const hasWindows = val.some(release => release.target === 'windows-amd64');

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

			if (app === 'apache' || app === 'dlang' || app === 'postgresql' || app === 'php' || app === 'ruby' || app === 'mysql' || app === 'perl') {
				expect(hasLinuxAmd64).toBe(true);
				if (app !== 'mysql' && app !== 'perl') {
					expect(hasMacAmd64).toBe(true);
				}
				if (app !== 'postgresql' && app !== 'php' && app !== 'ruby') {
					expect(hasWindows).toBe(true);
				}
			} else {
				expect(hasLinux).toBe(true);
				expect(hasMac).toBe(true);
				expect(hasWindows).toBe(true);
			}
  		}
  	});

	test('should have urls that are archives and not installers or .deb files', { timeout: 120000 }, async () => {
		if (!appReleases) {
			const results = await generateFeeds();
			appReleases = groupByApp(results);
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
				if (!release.url) continue;
				const url = release.url.toLowerCase();
				const hasAllowedExtension = allowedExtensions.some(ext => url.endsWith(ext));
				const hasForbiddenExtension = forbiddenExtensions.some(ext => url.endsWith(ext));

				if (!hasAllowedExtension || hasForbiddenExtension) {
					failures.push({
						app,
						version: release.version,
						target: release.target,
						url: release.url,
						reason: hasForbiddenExtension
							? 'has forbidden extension (installer or .deb)'
							: 'does not have an archive extension'
					});
				}

				expect(hasAllowedExtension).toBe(true);
				expect(hasForbiddenExtension).toBe(false);
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
