import { Release, Platform, Architecture } from '../types/release';

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
      name: `Caddy ${era}`,
      version,
      era,
      release_date: release.published_at || '',
      platforms: [
        {
          platform: Platform.linux,
          architecture: Architecture.amd64,
          url: `https://github.com/caddyserver/caddy/releases/download/v${version}/caddy_${version}_linux_amd64.tar.gz`,
          size: 0
        },
        {
          platform: Platform.windows,
          architecture: Architecture.amd64,
          url: `https://github.com/caddyserver/caddy/releases/download/v${version}/caddy_${version}_windows_amd64.zip`,
          size: 0
        },
        {
          platform: Platform.macos,
          architecture: Architecture.amd64,
          url: `https://github.com/caddyserver/caddy/releases/download/v${version}/caddy_${version}_mac_amd64.tar.gz`,
          size: 0
        },
        {
          platform: Platform.macos,
          architecture: Architecture.aarch64,
          url: `https://github.com/caddyserver/caddy/releases/download/v${version}/caddy_${version}_mac_arm64.tar.gz`,
          size: 0
        }
      ]
    });
  }

  // Sort by version descending for convenience
  releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

  return releases;
}
