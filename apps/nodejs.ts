import { Release, PlatformTarget } from '../types/release';

// Fetches available Node.js versions from the official Node.js index.json
export async function getReleases(): Promise<Release[]> {

	const res = await fetch('https://nodejs.org/dist/index.json');

	if (!res.ok) {
		throw new Error('Failed to fetch Node.js index.json');
	}

	const data = await res.json();
	const releases: Release[] = [];
	const latestByEra: Record<string, string> = {};

	for (const release of data) {
		const version = release.version.replace(/^v/, '');
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;
		const era = version.split('.')[0];
		if (parseInt(era) < 12) continue;
		if (!latestByEra[era] || version.localeCompare(latestByEra[era], undefined, { numeric: true }) > 0) {
			latestByEra[era] = version;
		}
	}

	for (const era in latestByEra) {
		const version = latestByEra[era];
		releases.push({
			id: `nodejs-${era}`,
			name: `Node.js ${version}`,
			version,
			era,
			endoflife: null,
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
			],
		});
	}

	if (!releases) {
		throw new Error('Failed to fetch Node.js releases');
	}

	releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

	return releases;
}
