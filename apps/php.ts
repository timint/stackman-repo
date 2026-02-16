import { Release, PlatformTarget } from '../types/release';

export async function getReleases(): Promise<Release[]> {
	const res = await fetch('https://www.php.net/releases/index.php?json');

	if (!res.ok) {
		throw new Error('Failed to fetch PHP releases');
	}

	const data = await res.json();
	const releases: Release[] = [];
	const latestByEra: Record<string, { version: string; releaseData: any }> = {};

	for (const majorVersion in data) {
		const releaseData = data[majorVersion];
		const version = releaseData.version;

		if (version < '5.6') {
			continue; // Skip older versions
		}

		if (version.match(/(alpha|beta|rc|dev|snapshot|a\d+|b\d+|rc\d+)/i)) {
			continue;
		}

		const era = `${version.split('.')[0]}.${version.split('.')[1]}`;

		if (!latestByEra[era] || version.localeCompare(latestByEra[era].version, undefined, { numeric: true }) > 0) {
			latestByEra[era] = { version, releaseData };
		}
	}

	for (const era in latestByEra) {
		const { version, releaseData } = latestByEra[era];
		releases.push({
			id: `php-${era}`,
			name: `PHP`,
			version,
			era,
			endoflife: null,
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
		});
	}

	if (!releases) {
		throw new Error('Failed to fetch PHP releases');
	}

	releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

	return releases;
}
