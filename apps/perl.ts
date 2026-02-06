import { Release, Platform, Architecture } from '../types/release';

// Fetches available Perl versions from the official Perl download page
export async function getReleases(): Promise<Release[]> {
  // Perl does not provide a public API for all versions; this is a placeholder
  const versions = ['5.38.0', '5.36.0', '5.34.0'];

  const releases: Release[] = [];

  for (const version of versions) {
    // Add both x86 and x64 architectures for each version
    releases.push({
      name: `Perl ${version}`,
      version,
      era: version.split('.').slice(0, 2).join('.'),
      release_date: '',
      description: 'Perl',
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

  return releases;
}
