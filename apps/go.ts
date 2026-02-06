import { Release, Platform, Architecture } from '../types/release';

// Fetches available Go versions from the official Go download page
export async function getReleases(): Promise<Release[]> {

  const res = await fetch('https://go.dev/dl/?mode=json');
  if (!res.ok) throw new Error('Failed to fetch Go releases');

  const data = await res.json();
  const releases: Release[] = [];

  for (const release of data) {
    const version = release.version.replace(/^go/, '');
    const era = `${version.split('.')[0]}.${version.split('.')[1]}`;

    releases.push({
      name: `Go ${version}`,
      version,
      era,
      release_date: release.release_date || '',
      platforms: []
    });

    const windowsFile = release.files?.find((f: any) => f.os === 'windows' && f.arch === 'amd64');
    if (windowsFile) {
      releases[releases.length - 1].platforms.push({
        platform: Platform.windows,
        architecture: Architecture.amd64,
        url: `https://go.dev/dl/go${version}.windows-amd64.zip`,
        size: windowsFile.size || 0
      });
    }

    const macosFile = release.files?.find((f: any) => f.os === 'darwin' && f.arch === 'amd64' && f.kind === 'archive');
    if (macosFile) {
      releases[releases.length - 1].platforms.push({
        platform: Platform.macos,
        architecture: Architecture.amd64,
        url: `https://go.dev/dl/${macosFile.filename}`,
        size: macosFile.size || 0
      });
    }

    const macosArmFile = release.files?.find((f: any) => f.os === 'darwin' && f.arch === 'arm64' && f.kind === 'archive');
    if (macosArmFile) {
      releases[releases.length - 1].platforms.push({
        platform: Platform.macos,
        architecture: Architecture.aarch64,
        url: `https://go.dev/dl/${macosArmFile.filename}`,
        size: macosArmFile.size || 0
      });
    }

    const linuxFile = release.files?.find((f: any) => f.os === 'linux' && f.arch === 'amd64' && f.kind === 'archive');
    if (linuxFile) {
      releases[releases.length - 1].platforms.push({
        platform: Platform.linux,
        architecture: Architecture.amd64,
        url: `https://go.dev/dl/${linuxFile.filename}`,
        size: linuxFile.size || 0
      });
    }
  }

  releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

  return releases;
}
