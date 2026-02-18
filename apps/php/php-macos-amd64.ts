import { Release, PlatformTarget } from '../../types/release';

export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://www.php.net/releases/index.php?json');
	if (!response.ok) throw new Error('Failed to fetch PHP releases');

	const data = await response.json();
	const releases: Record<string, Release> = {};

	for (const majorVersion in data) {
		const releaseData = data[majorVersion];
		const version = releaseData.version;

		if (version < '5.6') continue;
		if (version.match(/(alpha|beta|rc|dev|snapshot|a\d+|b\d+|rc\d+)/i)) continue;

		const era = `${version.split('.')[0]}.${version.split('.')[1]}`;

		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `php-${era}`,
				name: 'PHP',
				version,
				era,
				supported: true,
				url: `https://www.php.net/distributions/php-${version}.tar.gz`,
				target: PlatformTarget.macos_amd64
			};
		}
	}

	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));

	return sortedReleases;
}
