import { Release, Platform, Architecture } from '../types/release';

// Fetches available Zig versions from the official Zig download page

export async function getReleases(): Promise<Release[]> {
  // Zig does not provide a public API for all versions; this is a placeholder
  const versions = ['0.12.0', '0.11.0', '0.10.1'];

  const releases: Release[] = [];

  for (const version of versions) {
    // Add both x86 and x64 architectures for each version
    releases.push({
      name: `Zig ${version}`,
      version,
      era: version.split('.').slice(0, 2).join('.'),
      release_date: '',
      description: 'Zig',
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
