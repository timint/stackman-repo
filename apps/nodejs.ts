import { Release, PlatformTarget } from '../types/release';

// Fetches available Node.js versions from the official Node.js index.json
export async function getReleases(): Promise<Release[]> {

	// Fetch Node.js index.json
	const response = await fetch('https://nodejs.org/dist/index.json');

	if (!response.ok) {
		throw new Error('Failed to fetch Node.js index.json');
	}

	const data = await response.json();

	// Use era as array key for deduplication
	const releases: Record<string, Release> = {};

	for (const release of data) {
		const version = release.version.replace(/^v/, '');
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;

		const era = version.split('.')[0];
		if (parseInt(era, 10) < 12) continue;

		// Overwrite if version is newer for this era
		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `nodejs-${era}`,
				name: `Node.js ${version}`,
				version,
				era,
				supported: true,
				platforms: [
					{
						target: PlatformTarget.windows_amd64,
						url: `https://nodejs.org/dist/v${version}/node-v${version}-win-x64.zip`
					},
					{
						target: PlatformTarget.macos_amd64,
						url: `https://nodejs.org/dist/v${version}/node-v${version}-darwin-x64.tar.gz`
					},
					{
						target: PlatformTarget.macos_arm64,
						url: `https://nodejs.org/dist/v${version}/node-v${version}-darwin-arm64.tar.gz`
					},
					{
						target: PlatformTarget.linux_amd64,
						url: `https://nodejs.org/dist/v${version}/node-v${version}-linux-x64.tar.xz`
					},
					{
						target: PlatformTarget.linux_arm64,
						url: `https://nodejs.org/dist/v${version}/node-v${version}-linux-arm64.tar.xz`
					}
				]
			};
		}
	}

	// Convert releases object to array and sort by era (descending)
	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));

	return sortedReleases;
}
