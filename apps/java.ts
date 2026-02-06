import { Release, Platform, Architecture } from '../types/release';

// Fetches available Java versions from the official Adoptium API
export async function getReleases(): Promise<Release[]> {

  const res = await fetch('https://api.adoptium.net/v3/info/release_names?feature_version=17&release_type=ga');
  if (!res.ok) throw new Error('Failed to fetch Java releases');

  const data = await res.json();

  const releases: Release[] = [];

  for (const version of data.releases || []) {
    // Add both x86 and x64 architectures for each version
    releases.push({
      name: `Java ${version}`,
      version,
      era: version.split('.').slice(0, 2).join('.'),
      release_date: '',
      description: 'Java',
      platforms: [
        {
          platform: Platform.linux,
          architecture: Architecture.x86,
          url: '',
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
