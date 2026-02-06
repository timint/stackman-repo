import { Release, Platform, Architecture } from '../types/release';

// Fetches available Go versions from the official Go download page
export async function getReleases(): Promise<Release[]> {

  const res = await fetch('https://go.dev/dl/?mode=json');
  if (!res.ok) throw new Error('Failed to fetch Go releases');

  const data = await res.json();

  const releases: Release[] = [];

  for (const release of data) {
    const version = release.version.replace(/^go/, '');

    releases.push({
      name: `Go ${version}`,
      version,
      era: version.split('.').slice(0,2).join('.'),
      release_date: release.release_date || '',
      description: 'Go Programming Language',
      platforms: [
        {
          platform: Platform.linux,
          architecture: Architecture.x86_64,
          url: release.files?.find((f: any) => f.os === 'linux' && f.arch === 'amd64')?.url || '',
          size: release.files?.find((f: any) => f.os === 'linux' && f.arch === 'amd64')?.size || 0
        }
      ]
    });
  }

  releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

  return releases;
}
