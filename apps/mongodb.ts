import { Release, Platform, Architecture } from '../types/release';

// Fetches available MongoDB versions from the official MongoDB download center
export async function getReleases(): Promise<Release[]> {

	const res = await fetch('https://fastdl.mongodb.org/windows/');
  if (!res.ok) throw new Error('Failed to fetch MongoDB download page');

  const html = await res.text();
  const regex = /mongodb-windows-x86_64-(\d+\.\d+\.\d+)\.zip/g;
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
      name: `MongoDB ${era}`,
      version,
      era,
      release_date: '',
      platforms: [
        {
          platform: Platform.linux,
          architecture: Architecture.amd64,
          url: `https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-${version}.tgz`,
          size: 0
        },
        {
          platform: Platform.windows,
          architecture: Architecture.amd64,
          url: `https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-${version}.zip`,
          size: 0
        },
        {
          platform: Platform.macos,
          architecture: Architecture.amd64,
          url: `https://fastdl.mongodb.org/osx/mongodb-macos-x86_64-${version}.tgz`,
          size: 0
        },
        {
          platform: Platform.macos,
          architecture: Architecture.aarch64,
          url: `https://fastdl.mongodb.org/osx/mongodb-macos-arm64-${version}.tgz`,
          size: 0
        }
      ]
    });

  }

  releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

  return releases;
}
