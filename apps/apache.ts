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

    // Add both x86 and x64 architectures for each version
    releases.push({
      name: `Apache ${version}`,
      version,
      era: version.split('.').slice(0, 2).join('.'),
      release_date: '', // Not available from listing
      description: 'Apache HTTP Server',
      platforms: [
        {
          platform: Platform.linux,
          architecture: Architecture.x86,
          url: `https://downloads.apache.org/httpd/httpd-${version}.tar.gz`,
          size: 0 // Not available from listing
        },
        {
          platform: Platform.linux,
          architecture: Architecture.x64,
          url: `https://downloads.apache.org/httpd/httpd-${version}.tar.gz`,
          size: 0
        }
      ]
    });
  }

  // Sort by version descending for convenience
  releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

  return releases;
}
