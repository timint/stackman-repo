import { Release, PlatformTarget } from '../types/release';

export async function getReleases(): Promise<Release[]> {
	const res = await fetch('https://api.github.com/repos/oven-sh/bun/releases');
	if (!res.ok) throw new Error('Failed to fetch Bun releases');

	const data = await res.json();
	const releases: Release[] = [];
	const latestByEra: Record<string, { version: string; release: any }> = {};

	for (const release of data) {
		const version = release.tag_name.replace('bun-v', '');
		// Skip preview, rc, alpha, beta, nightly
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;
		const era = version.split('.')[0];

		if (!latestByEra[era] || version.localeCompare(latestByEra[era].version, undefined, { numeric: true }) > 0) {
			latestByEra[era] = { version, release };
		}
	}

	for (const era in latestByEra) {
		const { version, release } = latestByEra[era];
		releases.push({
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
		});
	}

	releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

	return releases;
}
