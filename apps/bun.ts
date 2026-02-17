import { Release, PlatformTarget } from '../types/release';

export async function getReleases(): Promise<Release[]> {
	// Fetch Bun releases from GitHub API
	const response = await fetch('https://api.github.com/repos/oven-sh/bun/releases');

	if (!response.ok) {
		throw new Error('Failed to fetch Bun releases');
	}

	const data = await response.json();

	// Use era as array key for deduplication
	const releases: Record<string, Release> = {};

	for (const release of data) {
		const version = release.tag_name.replace('bun-v', '');

		// Skip preview, rc, alpha, beta, nightly
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;

		// Use major version as era
		const era = version.split('.')[0];

		// Overwrite if version is newer for this era
		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `bun-${era}`,
				name: 'Bun',
				version,
				era,
				endoflife: null,
				platforms: [
					{
						target: PlatformTarget.linux_amd64,
						url: release.assets.find((asset: any) => asset.name === 'bun-linux-x64.zip')?.browser_download_url || ''
					},
					{
						target: PlatformTarget.linux_arm64,
						url: release.assets.find((asset: any) => asset.name === 'bun-linux-arm64.zip')?.browser_download_url || ''
					},
					{
						target: PlatformTarget.macos_amd64,
						url: release.assets.find((asset: any) => asset.name === 'bun-macos-x64.zip')?.browser_download_url || ''
					},
					{
						target: PlatformTarget.macos_arm64,
						url: release.assets.find((asset: any) => asset.name === 'bun-macos-arm64.zip')?.browser_download_url || ''
					},
					{
						target: PlatformTarget.windows_amd64,
						url: release.assets.find((asset: any) => asset.name === 'bun-windows-x64.zip')?.browser_download_url || ''
					}
				]
			};
		}
	}

	// Convert releases object to array and sort by era (descending)
	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));

	return sortedReleases;
}
