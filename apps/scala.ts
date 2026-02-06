import { Release, Platform, Architecture } from '../types/release';

// Fetches available Scala versions from the official Scala download page
export async function getReleases(): Promise<Release[]> {
  // Scala does not provide a public API for all versions; this is a placeholder
  const versions = ['3.3.1', '2.13.12', '2.12.18'];

  const releases: Release[] = [];

  for (const version of versions) {
    // Add both x86 and x64 architectures for each version
    releases.push({
      name: `Scala ${version}`,
      version,
      era: version.split('.').slice(0, 2).join('.'),
      release_date: '',
      description: 'Scala',
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
