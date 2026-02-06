import { Release, Architecture, Platform } from '../types/release';

// Fetches available Apache versions from the official Apache HTTPD download page
export async function getReleases(): Promise<Release[]> {

  // Download the Apache HTTPD directory listing
  const res = await fetch('https://downloads.apache.org/httpd/');
  if (!res.ok) throw new Error('Failed to fetch Apache download page');

  const html = await res.text();
  const regex = /httpd-([\d.]+)\.tar\.gz/g;
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
      name: `Apache ${era}`,
      version,
      era,
      release_date: '',
      platforms: [
        {
          platform: Platform.linux,
          architecture: Architecture.amd64,
          url: testUrl,
          size: 0
        },
        {
          platform: Platform.windows,
          architecture: Architecture.amd64,
          url: `https://www.apachelounge.com/download/VS17/binaries/httpd-${version}-win64-VS17.zip`,
          size: 0
        },
        {
          platform: Platform.macos,
          architecture: Architecture.amd64,
          url: testUrl,
          size: 0
        },
        {
          platform: Platform.macos,
          architecture: Architecture.aarch64,
          url: testUrl,
          size: 0
        }
      ]
    });
  }

  // Sort by version descending for convenience
  releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

  return releases;
}
