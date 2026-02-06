import { Release, Platform, Architecture } from '../types/release';

// Fetches available DLang versions from the official DLang download page
export async function getReleases(): Promise<Release[]> {
  const releases: Release[] = [];
  const seen = new Set<string>();

  const response = await fetch('https://github.com/dlang/dmd/releases');
  const html = await response.text();

  const versionRegex = /v(\d+\.\d+\.\d+)/g;
  let match;

  while ((match = versionRegex.exec(html)) !== null) {
    const version = match[1];

    if (seen.has(version)) {
      continue;
    }
    seen.add(version);

    const [major, minor] = version.split('.').map(Number);
    const era = `${major}.${minor}`;

    releases.push({
      name: `D ${era}`,
      version,
      era,
      release_date: '',
      platforms: [
        {
          platform: Platform.linux,
          architecture: Architecture.amd64,
          url: `https://github.com/dlang/dmd/releases/download/v${version}/dmd.stable.linux.tar.xz`,
          size: 0
        },
        {
          platform: Platform.windows,
          architecture: Architecture.amd64,
          url: `https://github.com/dlang/dmd/releases/download/v${version}/dmd.stable.windows.7z`,
          size: 0
        },
        {
          platform: Platform.macos,
          architecture: Architecture.amd64,
          url: `https://github.com/dlang/dmd/releases/download/v${version}/dmd.stable.osx.tar.xz`,
          size: 0
        },
        {
          platform: Platform.macos,
          architecture: Architecture.aarch64,
          url: `https://github.com/dlang/dmd/releases/download/v${version}/dmd.stable.osx.tar.xz`,
          size: 0
        }
      ]
    });
  }

  return releases;
}
