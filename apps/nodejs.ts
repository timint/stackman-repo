import { Release, Architecture, Platform } from '../types/release';

// Fetches available Node.js versions from the official Node.js index.json
export async function getReleases(): Promise<Release[]> {

	const res = await fetch('https://nodejs.org/dist/index.json');
  if (!res.ok) throw new Error('Failed to fetch Node.js index.json');

  const data = await res.json();

  const releases: Release[] = [];

  for (const release of data) {
    const version = release.version.replace(/^v/, '');
    const era = version.split('.')[0];

    if (parseInt(era) < 12) continue;

    releases.push({
      name: `Node.js ${version}`,
      version,
      era,
      release_date: release.date || '',
      platforms: []
    });

    if (release.files.includes('win-x64')) {
      releases[releases.length - 1].platforms.push({
        platform: Platform.windows,
        architecture: Architecture.amd64,
        url: `https://nodejs.org/dist/v${version}/node-v${version}-win-x64.zip`,
        size: 0
      });
    }

    if (release.files.includes('darwin-x64')) {
      releases[releases.length - 1].platforms.push({
        platform: Platform.macos,
        architecture: Architecture.amd64,
        url: `https://nodejs.org/dist/v${version}/node-v${version}-darwin-x64.tar.gz`,
        size: 0
      });
    }

    if (release.files.includes('darwin-arm64')) {
      releases[releases.length - 1].platforms.push({
        platform: Platform.macos,
        architecture: Architecture.aarch64,
        url: `https://nodejs.org/dist/v${version}/node-v${version}-darwin-arm64.tar.gz`,
        size: 0
      });
    }

    if (release.files.includes('linux-x64')) {
      releases[releases.length - 1].platforms.push({
        platform: Platform.linux,
        architecture: Architecture.amd64,
        url: `https://nodejs.org/dist/v${version}/node-v${version}-linux-x64.tar.xz`,
        size: 0
      });
    }
  }

  // Sort by version descending for convenience
  releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

  return releases;
}
