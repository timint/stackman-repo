import { Release, Platform, Architecture } from '../types/release';

// Fetches available Ruby versions from the official Ruby download page
export async function getReleases(): Promise<Release[]> {
  const res = await fetch('https://cache.ruby-lang.org/pub/ruby/');
  if (!res.ok) throw new Error('Failed to fetch Ruby download page');

  const html = await res.text();
  const regex = /href="(\d+\.\d+)\//g;
  const seen = new Set<string>();

  const releases: Release[] = [];

  let match: RegExpExecArray | null;
  while ((match = regex.exec(html))) {
    const era = match[1];
    // For each era, fetch the latest version (mocked for now)

    // Add both x86 and x64 architectures for each era
    releases.push({
      name: `Ruby ${era}`,
      version: era,
      era,
      release_date: '',
      description: 'Ruby',
      platforms: [
        {
          platform: Platform.linux,
          architecture: Architecture.x86,
          url: '',
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
