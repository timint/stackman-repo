import { Release, Platform, Architecture } from '../types/release';

// Fetches available Zig versions from the official Zig download page
export async function getReleases(): Promise<Release[]> {

	const res = await fetch('https://ziglang.org/download/index.json');
  if (!res.ok) throw new Error('Failed to fetch Zig releases');

  const data = await res.json();
  const releases: Release[] = [];

  const seen = new Set<string>();
  for (const key in data) {
    const version = key === 'master' ? data[key].version : key;
    if (seen.has(version)) continue;
    seen.add(version);

    const era = `${version.split('.')[0]}.${version.split('.')[1]}`;

    releases.push({
      name: `Zig ${era}`,
      version,
      era,
      release_date: '',
      platforms: []
    });

    const releaseData = data[key];

    if (releaseData['x86_64-windows']) {
      releases[releases.length - 1].platforms.push({
        platform: Platform.windows,
        architecture: Architecture.amd64,
        url: releaseData['x86_64-windows'].tarball,
        size: 0
      });
    }

    if (releaseData['x86_64-linux']) {
      releases[releases.length - 1].platforms.push({
        platform: Platform.linux,
        architecture: Architecture.amd64,
        url: releaseData['x86_64-linux'].tarball,
        size: 0
      });
    }

    if (releaseData['x86_64-macos']) {
      releases[releases.length - 1].platforms.push({
        platform: Platform.macos,
        architecture: Architecture.amd64,
        url: releaseData['x86_64-macos'].tarball,
        size: 0
      });
    }

    if (releaseData['aarch64-macos']) {
      releases[releases.length - 1].platforms.push({
        platform: Platform.macos,
        architecture: Architecture.aarch64,
        url: releaseData['aarch64-macos'].tarball,
        size: 0
      });
    }
  }

  return releases;
}
