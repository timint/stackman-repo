import { Release, Platform, Architecture } from '../types/release';

// Fetches available Python versions from official Python download page
export async function getReleases(): Promise<Release[]> {

  const res = await fetch('https://www.python.org/ftp/python/');
  if (!res.ok) throw new Error('Failed to fetch Python download page');

  const html = await res.text();
  const regex = /href="(\d+\.\d+\.\d+)\//g;
  const seen = new Set<string>();

  const releases: Release[] = [];

  let match: RegExpExecArray | null;
  while ((match = regex.exec(html))) {
    const version = match[1];
    if (seen.has(version)) continue;
    seen.add(version);

    const era = version.split('.')[0];

    releases.push({
      name: `Python ${version}`,
      version,
      era,
      release_date: '', // Not available from listing
      platforms: []
    });

    releases[releases.length - 1].platforms.push({
      platform: Platform.windows,
      architecture: Architecture.amd64,
      url: `https://www.python.org/ftp/python/${version}/python-${version}-embed-amd64.zip`,
      size: 0
    });

    releases[releases.length - 1].platforms.push({
      platform: Platform.macos,
      architecture: Architecture.aarch64,
      url: `https://www.python.org/ftp/python/${version}/python-${version}-macos11.pkg`,
      size: 0
    });

    releases[releases.length - 1].platforms.push({
      platform: Platform.linux,
      architecture: Architecture.amd64,
      url: `https://www.python.org/ftp/python/${version}/Python-${version}.tgz`,
      size: 0
    });
  }

  // Sort by version descending for convenience
  releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

  return releases;
}
