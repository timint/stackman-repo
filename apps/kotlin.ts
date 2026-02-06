import { Release, Platform, Architecture } from '../types/release';

// Fetches available Kotlin versions from the official Kotlin releases API
export async function getReleases(): Promise<Release[]> {

  const res = await fetch('https://api.github.com/repos/JetBrains/kotlin/releases');
  if (!res.ok) throw new Error('Failed to fetch Kotlin releases');

  const data = await res.json();

  const releases: Release[] = [];

  for (const release of data) {
    const version = release.tag_name.replace(/^v/, '');

    releases.push({
      name: `Kotlin ${version}`,
      version,
      era: version.split('.').slice(0,2).join('.'),
      release_date: release.published_at || '',
      description: 'Kotlin',
      platforms: [
        {
          platform: Platform.linux,
          architecture: Architecture.x86_64,
          url: '',
          size: 0
        }
      ]
    });
  }

  releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

  return releases;
}
