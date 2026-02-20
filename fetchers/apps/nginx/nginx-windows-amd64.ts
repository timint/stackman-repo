import { Release, PlatformTarget } from '../../../types/release';

export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://api.github.com/repos/nginx/nginx/releases?per_page=100');
	if (!response.ok) throw new Error('Failed to fetch Nginx releases from GitHub');

	const data = await response.json() as Array<{ tag_name: string; prerelease: boolean; assets: Array<{ name: string; browser_download_url: string }> }>;
	const releases: Record<string, Release> = {};

	for (const release of data) {
		const version = release.tag_name.replace(/^release-/, '');
		if (release.prerelease || /preview|rc|alpha|beta|nightly/i.test(version)) continue;

		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;

		const asset = release.assets.find(a => a.name === `nginx-${version}.zip`);
		if (!asset) continue;

		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `nginx-${era}`,
				name: 'Nginx',
				version,
				era,
				supported: null,
				url: asset.browser_download_url,
				target: PlatformTarget.windows_amd64
			};
		}
	}

	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));

	return sortedReleases;
}
