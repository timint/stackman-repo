import { Release, Architecture, Platform } from '../types/release';

export async function getReleases(): Promise<Release[]> {
  const res = await fetch('https://nginx.org/en/download.html');
  if (!res.ok) throw new Error('Failed to fetch Nginx download page');

  const html = await res.text();
  const regex = /nginx-([\d.]+)\.tar\.gz/g;
  const seen = new Set<string>();

  const releases: Release[] = [];

  let match: RegExpExecArray | null;
  while ((match = regex.exec(html))) {
    const version = match[1];
    if (seen.has(version)) continue;
    seen.add(version);

    const [major, minor] = version.split('.').map(Number);
    const era = `${major}.${minor}`;

    releases.push({
      name: `Nginx ${era}`,
      version,
      era,
      release_date: '',
      platforms: [
        {
          platform: Platform.linux,
          architecture: Architecture.amd64,
          url: `https://nginx.org/download/nginx-${version}.tar.gz`,
          size: 0
        },
        {
          platform: Platform.windows,
          architecture: Architecture.amd64,
          url: `https://nginx.org/download/nginx-${version}.win64.zip`,
          size: 0
        },
        {
          platform: Platform.macos,
          architecture: Architecture.amd64,
          url: `https://nginx.org/download/nginx-${version}.tar.gz`,
          size: 0
        },
        {
          platform: Platform.macos,
          architecture: Architecture.aarch64,
          url: `https://nginx.org/download/nginx-${version}.tar.gz`,
          size: 0
        }
      ]
    });
  }

  releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

  return releases;
}
