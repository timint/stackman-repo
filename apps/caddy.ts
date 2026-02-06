import { Release, PlatformTarget } from '../types/release';

// Fetches available Caddy versions from GitHub releases
export async function getReleases(): Promise<Release[]> {

	const res = await fetch('https://api.github.com/repos/caddyserver/caddy/releases');
	if (!res.ok) throw new Error('Failed to fetch Caddy releases');

	const data = await res.json();
	const releases: Release[] = [];
	const seen = new Set<string>();

	for (const release of data) {
		const version = release.tag_name.replace(/^v/, '');
		if (seen.has(version)) continue;
		seen.add(version);

		const [major] = version.split('.').map(Number);
		const era = `${major}`;

		releases.push({
			name: `Caddy`,
			version,
			era,
			platforms: [
				{
					target: PlatformTarget.linux_amd64,
					url: `https://github.com/caddyserver/caddy/releases/download/v${version}/caddy_${version}_linux_amd64.tar.gz`
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
		});
	}

	// Sort by version descending for convenience
	releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

	return releases;
}
