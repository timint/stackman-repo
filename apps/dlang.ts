import { Release, Platform, Architecture } from '../types/release';

// Fetches available DLang versions from the official DLang download page
export async function getReleases(): Promise<Release[]> {

  // DLang does not provide a public API for all versions; this is a placeholder
  const versions = ['2.105.2', '2.104.0', '2.103.1'];

  return versions.map(version => ({
    name: `D ${version}`,
    version,
    era: version.split('.').slice(0,2).join('.'),
    release_date: '',
    description: 'D Programming Language',
    platforms: [
      {
        platform: Platform.linux,
        architecture: Architecture.x86_64,
        url: '',
        size: 0
      }
    ]
  }));
}
