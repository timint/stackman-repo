import { Release, PlatformTarget } from '../types/release';

export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://api.github.com/repos/caddyserver/caddy/releases');
	if (!response.ok) throw new Error('Failed to fetch Caddy releases');

	const data = await response.json();
	const seen = new Set<string>();
	// Use era as array key for deduplication
	const releases: Record<string, Release> = {};

	for (const release of data) {
		const version = release.tag_name.replace(/^v/, '');
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;
		if (seen.has(version)) continue;
		seen.add(version);
		const [major] = version.split('.').map(Number);
		const era = `${major}`;

		// Overwrite if version is newer for this era
		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `caddy-${era}`,
				name: 'Caddy',
				version,
				era,
				endoflife: null,
				platforms: [
					{
						target: PlatformTarget.linux_amd64,
						url: `https://github.com/caddyserver/caddy/releases/download/v${version}/caddy_${version}_linux_amd64.tar.gz`
					},
					{
						target: PlatformTarget.linux_arm64,
						url: `https://github.com/caddyserver/caddy/releases/download/v${version}/caddy_${version}_linux_arm64.tar.gz`
					},
					{
						target: PlatformTarget.windows_amd64,
						url: `https://github.com/caddyserver/caddy/releases/download/v${version}/caddy_${version}_windows_amd64.zip`
					},
					{
						target: PlatformTarget.macos_amd64,
						url: `https://github.com/caddyserver/caddy/releases/download/v${version}/caddy_${version}_mac_amd64.tar.gz`
					},
					{
						target: PlatformTarget.macos_arm64,
						url: `https://github.com/caddyserver/caddy/releases/download/v${version}/caddy_${version}_mac_arm64.tar.gz`
					}
				]
			};
		}
	}

	// Convert releases object to array and sort by era (descending)
	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));

	return sortedReleases;
}
