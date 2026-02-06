import { Release, Architecture, Platform } from '../types/release';

// Fetches available Node.js versions from the official Node.js index.json
export async function getReleases(): Promise<Release[]> {
  const res = await fetch('https://nodejs.org/dist/index.json');
  if (!res.ok) throw new Error('Failed to fetch Node.js index.json');

  const data = await res.json();

  const releases: Release[] = [];

  for (const release of data) {
    const version = release.version.replace(/^v/, '');

    // Add both x86 and x64 architectures for each version
    releases.push({
      name: `Node.js ${version}`,
      version,
      era: version.split('.').slice(0, 2).join('.'),
      release_date: release.date || '',
      description: 'Node.js',
      platforms: [
        {
          platform: Platform.linux,
          architecture: Architecture.x86,
          url: `https://nodejs.org/dist/v${version}/node-v${version}-linux-x64.tar.xz`,
          size: 0 // Not available from feed
        },
        {
          platform: Platform.linux,
          architecture: Architecture.x64,
          url: `https://nodejs.org/dist/v${version}/node-v${version}-linux-x64.tar.xz`,
          size: 0
        }
      ]
    });

  }

  // Sort by version descending for convenience
  releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

  return releases;
}
