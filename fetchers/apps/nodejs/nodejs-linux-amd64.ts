import { Release, PlatformTarget } from '../../../types/release';

export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://nodejs.org/dist/index.json');
	if (!response.ok) {
		throw new Error('Failed to fetch Node.js index.json');
	}

	const data = await response.json();
	const releases: Record<string, Release> = {};

	for (const release of data) {
		const version = release.version.replace(/^v/, '');
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;

		const era = version.split('.')[0];
		if (parseInt(era, 10) < 12) continue;

		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `nodejs-${era}`,
				name: `Node.js ${version}`,
				version,
				era,
				supported: null,
				url: `https://nodejs.org/dist/v${version}/node-v${version}-linux-x64.tar.xz`,
				target: PlatformTarget.linux_amd64,
				size: null
			};
		}
	}

	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));
	return sortedReleases;
}
