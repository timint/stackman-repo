import { Release, Platform, Architecture } from '../types/release';

// Fetches available .NET versions from the official .NET releases index
export async function getReleases(): Promise<Release[]> {

  const res = await fetch('https://dotnetcli.blob.core.windows.net/dotnet/release-metadata/releases-index.json');
  if (!res.ok) throw new Error('Failed to fetch .NET releases');

  const data = await res.json();

  const releases: Release[] = [];

  for (const release of data.releases || []) {
    const version = release.latest_release;

    releases.push({
      name: `.NET ${version}`,
      version,
      era: version.split('.').slice(0,2).join('.'),
      release_date: release.latest_release_date || '',
      description: '.NET',
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
