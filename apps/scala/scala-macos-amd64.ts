import { Release, PlatformTarget } from '../../types/release';

export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://api.github.com/repos/scala/scala3/releases');

	if (!response.ok) {
		throw new Error('Failed to fetch Scala 3 releases from GitHub');
	}

	const releases: Release[] = [];
	const seen = new Set<string>();
	const data = await response.json() as Array<{
		tag_name: string;
		prerelease: boolean;
		assets: Array<{
			name: string;
			browser_download_url: string;
		}>;
	}>;

	for (const release of data) {
		const version = release.tag_name;
		if (release.prerelease || /preview|rc|alpha|beta|nightly/i.test(version)) continue;
		if (seen.has(version)) continue;
		seen.add(version);

		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;

		const asset = release.assets.find(a => a.name === `scala3-${version}-x86_64-apple-darwin.tar.gz`);
		if (!asset) continue;

		releases.push({
			id: `scala-${era}`,
			name: `Scala ${version}`,
			version,
			era,
			supported: true,
			url: asset.browser_download_url,
			target: PlatformTarget.macos_amd64
		});
	}

	return releases.sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));
}
