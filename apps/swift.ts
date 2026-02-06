import { Release, Platform, Architecture } from '../types/release';

// Fetches available Swift versions from the official Swift download page
export async function getReleases(): Promise<Release[]> {
  // Swift does not provide a public API for all versions; this is a placeholder
  const versions = ['5.9.2', '5.8.1', '5.7.3'];

  const releases: Release[] = [];

  for (const version of versions) {
    // Add both x86 and x64 architectures for each version
    releases.push({
      name: `Swift ${version}`,
      version,
      era: version.split('.').slice(0, 2).join('.'),
      release_date: '',
      description: 'Swift',
      platforms: [
        {
          platform: Platform.macos,
          architecture: Architecture.x86,
          url: '',
          size: 0
        },
        {
          platform: Platform.macos,
          architecture: Architecture.x64,
          url: '',
          size: 0
        }
      ]
    });

  }

  return releases;
}
