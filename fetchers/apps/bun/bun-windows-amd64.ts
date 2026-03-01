import { Release, PlatformTarget } from '../../../types/release';

export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://api.github.com/repos/oven-sh/bun/releases?per_page=100');

	if (!response.ok) {
		throw new Error('Failed to fetch Bun releases');
	}

	const data = await response.json();

	const releases: Record<string, Release> = {};

	for (const release of data) {
		const version = release.tag_name.replace('bun-v', '');

		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;

		const era = version.split('.').slice(0, 2).join('.');

		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `bun-${era}`,
				name: 'Bun',
				version,
				era,
				supported: null,
				url: release.assets.find((asset: any) => asset.name === 'bun-windows-x64.zip')?.browser_download_url || '',
				target: PlatformTarget.windows_amd64,
				size: null
			};
		}
	}

	return Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));
}
