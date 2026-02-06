import { Release, Architecture, Platform } from '../types/release';

// Fetches available MySQL versions from the official MySQL download page
export async function getReleases(): Promise<Release[]> {
  const res = await fetch('https://dev.mysql.com/downloads/mysql/');
  if (!res.ok) throw new Error('Failed to fetch MySQL download page');

  const html = await res.text();
  const regex = /MySQL Community Server ([\d.]+)/g;
  const seen = new Set<string>();

  const releases: Release[] = [];

  let match: RegExpExecArray | null;
  while ((match = regex.exec(html))) {
    const version = match[1];
    if (seen.has(version)) continue;
    seen.add(version);

    // Add both x86 and x64 architectures for each version
    releases.push({
      name: `MySQL ${version}`,
      version,
      era: version.split('.').slice(0, 2).join('.'),
      release_date: '', // Not available from listing
      description: 'MySQL Community Server',
      platforms: [
        {
          platform: Platform.linux,
          architecture: Architecture.x86,
          url: '', // Not available from listing
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

  // Sort by version descending for convenience
  releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

  return releases;
}
