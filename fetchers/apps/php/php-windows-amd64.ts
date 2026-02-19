import { Release, PlatformTarget } from '../../../types/release';

export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://www.php.net/releases/index.php?json');

	if (!response.ok) {
		throw new Error('Failed to fetch PHP releases');
	}

	const data = await response.json();
	const releases: Record<string, Release> = {};

	for (const majorVersion in data) {
		const releaseData = data[majorVersion];
		const version = releaseData.version;

		if (version < '5.6') continue;

		if (version.match(/(alpha|beta|rc|dev|snapshot|a\d+|b\d+|rc\d+)/i)) continue;

		const era = `${version.split('.')[0]}.${version.split('.')[1]}`;

		const major = version.split('.')[0];
		const minor = version.split('.')[1];

		let compilerTag = 'vs16';
		if (major === '7' && minor === '4') {
			compilerTag = 'vc15';
		} else if (major >= '8' && minor >= '4') {
			compilerTag = 'vs17';
		}

		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `php-${era}`,
				name: 'PHP',
				version,
				era,
				supported: null,
				url: `https://windows.php.net/downloads/releases/php-${version}-Win32-${compilerTag}-x64.zip`,
				target: PlatformTarget.windows_amd64
			};
		}
	}

	return Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));
}
