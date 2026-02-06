import { Release, Platform, Architecture } from '../types/release';

// Fetches available PostgreSQL versions from the official PostgreSQL source download page
export async function getReleases(): Promise<Release[]> {
  const res = await fetch('https://ftp.postgresql.org/pub/source/');
  if (!res.ok) throw new Error('Failed to fetch PostgreSQL download page');

  const html = await res.text();
  const regex = /href="v(\d+\.\d+(?:\.\d+)?)\//g;
  const seen = new Set<string>();

  const releases: Release[] = [];

  let match: RegExpExecArray | null;
  while ((match = regex.exec(html))) {
    const version = match[1];
    if (seen.has(version)) continue;
    seen.add(version);

    // Add both x86 and x64 architectures for each version
    releases.push({
      name: `PostgreSQL ${version}`,
      version,
      era: version.split('.').slice(0, 2).join('.'),
      release_date: '', // Not available from listing
      description: 'PostgreSQL',
      platforms: [
        {
          platform: Platform.linux,
          architecture: Architecture.x86,
          url: `https://ftp.postgresql.org/pub/source/v${version}/postgresql-${version}.tar.gz`,
          size: 0
        },
        {
          platform: Platform.linux,
          architecture: Architecture.x64,
          url: `https://ftp.postgresql.org/pub/source/v${version}/postgresql-${version}.tar.gz`,
          size: 0
        }
      ]
    });

  }

  // Sort by version descending for convenience
  releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

  return releases;
}
