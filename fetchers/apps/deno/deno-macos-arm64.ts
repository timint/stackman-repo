import { Release, PlatformTarget } from '../../../types/release';

export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://api.github.com/repos/denoland/deno/releases?per_page=100');

	if (!response.ok) {
		throw new Error('Failed to fetch Deno releases');
	}

	const data = await response.json();

	const releases: Record<string, Release> = {};

	for (const release of data) {
		const version = release.tag_name.replace('v', '');

		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;

		const era = version.split('.').slice(0, 2).join('.');

		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `deno-${era}`,
				name: 'Deno',
				version,
				era,
				supported: null,
				url: release.assets.find((asset: any) => asset.name === 'deno-aarch64-apple-darwin.zip')?.browser_download_url || '',
				target: PlatformTarget.macos_arm64
			};
		}
	}

	return Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));
}
