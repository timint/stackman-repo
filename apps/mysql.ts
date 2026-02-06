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

    const [major, minor] = version.split('.').map(Number);
    const era = `${major}.${minor}`;

    releases.push({
      name: `MySQL ${era}`,
      version,
      era,
      release_date: '',
      platforms: [
        {
          platform: Platform.linux,
          architecture: Architecture.amd64,
          url: `https://dev.mysql.com/get/Downloads/MySQL-${era}/mysql-${version}-linux-glibc2.12-x86_64.tar.xz`,
          size: 0
        },
        {
          platform: Platform.windows,
          architecture: Architecture.amd64,
          url: `https://dev.mysql.com/get/Downloads/MySQL-${era}/mysql-${version}-winx64.zip`,
          size: 0
        },
        {
          platform: Platform.macos,
          architecture: Architecture.amd64,
          url: `https://dev.mysql.com/get/Downloads/MySQL-${era}/mysql-${version}-macos13-x86_64.tar.gz`,
          size: 0
        },
        {
          platform: Platform.macos,
          architecture: Architecture.aarch64,
          url: `https://dev.mysql.com/get/Downloads/MySQL-${era}/mysql-${version}-macos13-arm64.tar.gz`,
          size: 0
        }
      ]
    });

  }

  // Sort by version descending for convenience
  releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

  return releases;
}
