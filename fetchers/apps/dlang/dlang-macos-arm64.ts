import { Release, PlatformTarget } from '../../../types/release';

export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://api.github.com/repos/dlang/dmd/releases?per_page=100');
	if (!response.ok) throw new Error('Failed to fetch DLang releases from GitHub');

	const data = await response.json() as Array<{ tag_name: string; prerelease: boolean; assets: Array<{ name: string; browser_download_url: string }> }>;
	const releases: Record<string, Release> = {};

	for (const release of data) {
		const version = release.tag_name.replace(/^v/, '');
		if (release.prerelease || /preview|rc|alpha|beta|nightly/i.test(version)) continue;

		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;

		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `dlang-${era}`,
				name: 'D',
				version,
				era,
				supported: null,
				url: release.assets.find((asset: any) => asset.name === 'dmd.stable.osx.tar.xz')?.browser_download_url || '',
				target: PlatformTarget.macos_arm64
			};
		}
	}

	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));

	return sortedReleases;
}
