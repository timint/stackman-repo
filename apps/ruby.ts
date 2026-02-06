import { Release, Platform, Architecture } from '../types/release';

// Fetches available Ruby versions from the official Ruby download page
export async function getReleases(): Promise<Release[]> {

	const res = await fetch('https://www.ruby-lang.org/en/downloads/releases/');
  if (!res.ok) throw new Error('Failed to fetch Ruby download page');

  const html = await res.text();
  const regex = />Ruby (\d+\.\d+\.\d+)</g;
  const seen = new Set<string>();

  const releases: Release[] = [];

  let match: RegExpExecArray | null;
  while ((match = regex.exec(html))) {
    const version = match[1];
    if (seen.has(version)) continue;
    seen.add(version);

    const era = `${version.split('.')[0]}.${version.split('.')[1]}`;

    releases.push({
      name: `Ruby ${era}`,
      version,
      era,
      release_date: '',
      platforms: []
    });

    releases[releases.length - 1].platforms.push({
      platform: Platform.windows,
      architecture: Architecture.amd64,
      url: `https://cache.ruby-lang.org/pub/ruby/${era}/ruby-${version}-x64-mingw32.7z`,
      size: 0
    });

    releases[releases.length - 1].platforms.push({
      platform: Platform.linux,
      architecture: Architecture.amd64,
      url: `https://cache.ruby-lang.org/pub/ruby/${era}/ruby-${version}.tar.gz`,
      size: 0
    });

    releases[releases.length - 1].platforms.push({
      platform: Platform.macos,
      architecture: Architecture.aarch64,
      url: `https://cache.ruby-lang.org/pub/ruby/${era}/ruby-${version}.tar.gz`,
      size: 0
    });
  }

  // Sort by version descending for convenience
  releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

  return releases;
}
