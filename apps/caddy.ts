import { Release, PlatformTarget } from '../types/release';

export async function getReleases(): Promise<Release[]> {
	const res = await fetch('https://api.github.com/repos/caddyserver/caddy/releases');
	if (!res.ok) throw new Error('Failed to fetch Caddy releases');

	const data = await res.json();
	const releases: Release[] = [];
	const seen = new Set<string>();

	const latestByEra: Record<string, string> = {};
	const releaseMap: Record<string, any> = {};
	for (const release of data) {
		const version = release.tag_name.replace(/^v/, '');
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;
		if (seen.has(version)) continue;
		seen.add(version);
		const [major] = version.split('.').map(Number);
		const era = `${major}`;
		if (!latestByEra[era] || version.localeCompare(latestByEra[era], undefined, { numeric: true }) > 0) {
			latestByEra[era] = version;
			releaseMap[era] = release;
		}
	}
	for (const era in latestByEra) {
		const version = latestByEra[era];
		const release = releaseMap[era];
		releases.push({
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
		});
	}

	if (!releases) {
		throw new Error('Failed to fetch Caddy releases');
	}

	releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

	return releases;
}
