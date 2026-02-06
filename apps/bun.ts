import { Release, Platform, Architecture } from '../types/release';

// Fetches available Bun versions from the GitHub releases API
export async function getReleases(): Promise<Release[]> {

  const res = await fetch('https://api.github.com/repos/oven-sh/bun/releases');
  if (!res.ok) throw new Error('Failed to fetch Bun releases');

  const data = await res.json();
  const releases: Release[] = [];

  for (const release of data) {
    const version = release.tag_name.replace('bun-v', '');
    const asset = release.assets?.find((a: any) => a.name.endsWith('.tar.gz'));
    const url = asset?.browser_download_url || '';
    const size = asset?.size || 0;

    // Add both x86 and x64 architectures for each version
    releases.push({
      name: `Bun ${version}`,
      version,
      era: version.split('.').slice(0, 2).join('.'),
      release_date: release.published_at || '',
      description: 'Bun JavaScript Runtime',
      platforms: [
        {
          platform: Platform.linux,
          architecture: Architecture.x86,
          url,
          size
        },
        {
          platform: Platform.linux,
          architecture: Architecture.x64,
          url,
          size
        }
      ]
    });
  }

  // Sort by version descending for convenience
  releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

  return releases;
}
