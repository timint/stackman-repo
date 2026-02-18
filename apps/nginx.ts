import { Release, PlatformTarget } from '../types/release';

export async function getReleases(): Promise<Release[]> {
	// Fetch Nginx download page
	const response = await fetch('https://nginx.org/en/download.html');
	if (!response.ok) throw new Error('Failed to fetch Nginx download page');

	const html = await response.text();
	const regex = /nginx-([\d.]+)\.tar\.gz/g;

	const seen = new Set<string>();
	// Use era as array key for deduplication
	const releases: Record<string, Release> = {};

	let match: RegExpExecArray | null;
	while ((match = regex.exec(html))) {
		const version = match[1];
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;
		if (seen.has(version)) continue;
		seen.add(version);
		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;

		// Overwrite if version is newer for this era
		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `nginx-${era}`,
				name: 'Nginx',
				version,
				era,
				supported: true,
				platforms: [
					{
						target: PlatformTarget.linux_amd64,
						url: `https://nginx.org/download/nginx-${version}.tar.gz`
					},
					{
						target: PlatformTarget.linux_arm64,
						url: `https://nginx.org/download/nginx-${version}.tar.gz`
					},
					{
						target: PlatformTarget.macos_amd64,
						url: `https://nginx.org/download/nginx-${version}.tar.gz`
					},
					{
						target: PlatformTarget.macos_arm64,
						url: `https://nginx.org/download/nginx-${version}.tar.gz`
					},
					{
						target: PlatformTarget.windows_amd64,
						url: `https://nginx.org/download/nginx-${version}.zip`
					}
				]
			};
		}
	}

	// Convert releases object to array and sort by era (descending)
	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));

	return sortedReleases;
}
