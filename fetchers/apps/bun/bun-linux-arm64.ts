import { Release, PlatformTarget } from '../../../types/release';

export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://api.github.com/repos/oven-sh/bun/releases');

	if (!response.ok) {
		throw new Error('Failed to fetch Bun releases');
	}

	const data = await response.json();

	const releases: Record<string, Release> = {};

	for (const release of data) {
		const version = release.tag_name.replace('bun-v', '');

		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;

		const era = version.split('.')[0];

		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `bun-${era}`,
				name: 'Bun',
				version,
				era,
				supported: null,
				url: release.assets.find((asset: any) => asset.name === 'bun-linux-aarch64.zip')?.browser_download_url || '',
				target: PlatformTarget.linux_arm64
			};
		}
	}

	return Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));
}
