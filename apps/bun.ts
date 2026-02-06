import { Release, Platform, Architecture } from '../types/release';

// Fetches available Bun versions from the GitHub releases API
export async function getReleases(): Promise<Release[]> {

  const res = await fetch('https://api.github.com/repos/oven-sh/bun/releases');
  if (!res.ok) throw new Error('Failed to fetch Bun releases');

  const data = await res.json();
  const releases: Release[] = [];

  for (const release of data) {
    const version = release.tag_name.replace('bun-v', '');
    const era = version.split('.')[0];
    const releaseDate = release.published_at || '';

    const windowsAsset = release.assets?.find((a: any) => a.name.includes('windows-x64'));
    const macosAsset = release.assets?.find((a: any) => a.name.includes('darwin-aarch64') || a.name.includes('macos-aarch64'));
    const linuxAsset = release.assets?.find((a: any) => a.name.includes('linux-x64'));

    releases.push({
      name: `Bun ${version}`,
      version,
      era,
      release_date: releaseDate,
      platforms: []
    });

    if (windowsAsset) {
      releases[releases.length - 1].platforms.push({
        platform: Platform.windows,
        architecture: Architecture.amd64,
        url: `https://github.com/oven-sh/bun/releases/download/bun-v${version}/bun-windows-x64.zip`,
        size: windowsAsset.size || 0
      });
    }

    if (macosAsset) {
      releases[releases.length - 1].platforms.push({
        platform: Platform.macos,
        architecture: Architecture.aarch64,
        url: macosAsset.browser_download_url,
        size: macosAsset.size || 0
      });
    }

    if (linuxAsset) {
      releases[releases.length - 1].platforms.push({
        platform: Platform.linux,
        architecture: Architecture.amd64,
        url: linuxAsset.browser_download_url,
        size: linuxAsset.size || 0
      });
    }
  }

  // Sort by version descending for convenience
  releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

  return releases;
}
