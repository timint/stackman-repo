import { Release, PlatformTarget } from '../types/release';

export async function getReleases(): Promise<Release[]> {
	// Fetch PHP release data from the official API
	const response = await fetch('https://www.php.net/releases/index.php?json');

	if (!response.ok) {
		throw new Error('Failed to fetch PHP releases');
	}

	const data = await response.json();

	// Use era as array key for deduplication
	const releases: Record<string, Release> = {};

	for (const majorVersion in data) {
		const releaseData = data[majorVersion];
		const version = releaseData.version;

		// Skip older versions
		if (version < '5.6') {
			continue;
		}

		// Skip pre-releases
		if (version.match(/(alpha|beta|rc|dev|snapshot|a\d+|b\d+|rc\d+)/i)) {
			continue;
		}

		// Determine era (major.minor)
		const era = `${version.split('.')[0]}.${version.split('.')[1]}`;

		// Overwrite if version is newer for this era
		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `php-${era}`,
				name: 'PHP',
				version,
				era,
				supported: true,
				platforms: [
					{
						target: PlatformTarget.linux_amd64,
						url: `https://www.php.net/distributions/php-${version}.tar.gz`
					},
					{
						target: PlatformTarget.linux_arm64,
						url: `https://www.php.net/distributions/php-${version}.tar.gz`
					},
					{
						target: PlatformTarget.macos_amd64,
						url: `https://www.php.net/distributions/php-${version}.tar.gz`
					},
					{
						target: PlatformTarget.macos_arm64,
						url: `https://www.php.net/distributions/php-${version}.tar.gz`
					}
				]
			};
		}
	}

	// Convert releases object to array and sort by era (descending)
	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));

	return sortedReleases;
}
