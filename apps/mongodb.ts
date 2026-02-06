import { Release, Platform, Architecture } from '../types/release';

// Fetches available MongoDB versions from the official MongoDB download center
export async function getReleases(): Promise<Release[]> {
  // In reality, MongoDB does not provide a public API for all versions; this is a placeholder
  const versions = ['7.0.5', '6.0.13', '5.0.21'];

  const releases: Release[] = [];

  for (const version of versions) {
    releases.push({
      name: `MongoDB ${version}`,
      version,
      era: version.split('.').slice(0, 2).join('.'),
      release_date: '',
      description: 'MongoDB',
      platforms: [
        {
          platform: Platform.linux,
          architecture: Architecture.x86,
          url: `https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-${version}.tgz`,
          size: 0
        },
        {
          platform: Platform.linux,
          architecture: Architecture.x64,
          url: `https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-${version}.tgz`,
          size: 0
        }
      ]
    });

  }

  return releases;
}
