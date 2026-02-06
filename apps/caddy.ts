import { Release, Platform, Architecture } from '../types/release';

// Fetches available Caddy versions from GitHub releases
export async function getReleases(): Promise<Release[]> {

  const res = await fetch('https://api.github.com/repos/caddyserver/caddy/releases');
  if (!res.ok) throw new Error('Failed to fetch Caddy releases');

  const data = await res.json();

  const releases: Release[] = [];

  for (const release of data) {
    const version = release.tag_name.replace(/^v/, '');

    // Add both x86 and x64 architectures for each version
    releases.push({
      name: `Caddy ${version}`,
      version,
      era: version.split('.').slice(0, 2).join('.'),
      release_date: release.published_at || '',
      description: 'Caddy Web Server',
      platforms: [
        {
          platform: Platform.linux,
          architecture: Architecture.x86,
          url: '', // Asset URL parsing can be added
          size: 0
        },
        {
          platform: Platform.linux,
          architecture: Architecture.x64,
          url: '',
          size: 0
        }
      ]
    });
  }

  // Sort by version descending for convenience
  releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

  return releases;
}
