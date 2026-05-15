import { PlatformTarget, Release } from '../../../types/release';

interface SwiftPlatform {
  name: string;
  platform: string;
  archs: string[];
}

interface SwiftRelease {
  name: string;
  tag: string;
  date: string;
  xcode?: string;
  platforms: SwiftPlatform[];
}

interface VersionCandidate {
  version: string;
  url: string;
}

function getEra(version: string): string {
  const parts = version.split('.');
  return `${parts[0]}.${parts[1]}`;
}

function compareVersionsDescending(a: string, b: string): number {
  return b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' });
}

function hasArchitecture(platform: SwiftPlatform, arch: string): boolean {
  return platform.archs.includes(arch);
}

// Find the best matching Linux platform for a given release and arch
function getBestLinuxPlatform(release: SwiftRelease, arch: string): SwiftPlatform | null {
  // Preferred Ubuntu versions in order (most compatible choice first)
  const preferred = ['Ubuntu 22.04', 'Ubuntu 24.04', 'Ubuntu 20.04', 'Ubuntu 18.04'];
  for (const name of preferred) {
    const platform = release.platforms.find(
      p => p.platform === 'Linux' && p.name === name && hasArchitecture(p, arch)
    );
    if (platform) return platform;
  }
  return null;
}

// Map Ubuntu platform name to URL directory and filename components
const ubuntuUrlMap: Record<string, { dir: string; file: string }> = {
  'Ubuntu 24.04': { dir: 'ubuntu2404', file: 'ubuntu24.04' },
  'Ubuntu 22.04': { dir: 'ubuntu2204', file: 'ubuntu22.04' },
  'Ubuntu 20.04': { dir: 'ubuntu2004', file: 'ubuntu20.04' },
  'Ubuntu 18.04': { dir: 'ubuntu1804', file: 'ubuntu18.04' },
};

function getLinuxDownloadUrl(version: string, platformName: string, arch: string): string {
  const base = `https://download.swift.org/swift-${version}-release`;
  const suffix = ubuntuUrlMap[platformName];
  if (!suffix) return '';
  if (arch === 'aarch64') {
    return `${base}/${suffix.dir}-aarch64/swift-${version}-RELEASE/swift-${version}-RELEASE-${suffix.file}-aarch64.tar.gz`;
  }
  return `${base}/${suffix.dir}/swift-${version}-RELEASE/swift-${version}-RELEASE-${suffix.file}.tar.gz`;
}

function getMacOSDownloadUrl(version: string): string {
  // Universal .pkg installer works for both Intel and Apple Silicon
  return `https://download.swift.org/swift-${version}-release/xcode/swift-${version}-RELEASE/swift-${version}-RELEASE-osx.pkg`;
}

function getVersionCandidate(release: SwiftRelease, target: PlatformTarget): VersionCandidate | null {
  const version = release.name;

  switch (target) {
    case PlatformTarget.linux_amd64: {
      const platform = getBestLinuxPlatform(release, 'x86_64');
      if (!platform) return null;
      return { version, url: getLinuxDownloadUrl(version, platform.name, 'x86_64') };
    }
    case PlatformTarget.linux_arm64: {
      const platform = getBestLinuxPlatform(release, 'aarch64');
      if (!platform) return null;
      return { version, url: getLinuxDownloadUrl(version, platform.name, 'aarch64') };
    }
    case PlatformTarget.macos_amd64:
    case PlatformTarget.macos_arm64: {
      // macOS toolchain (.pkg) is published for all Xcode-associated releases
      if (!release.xcode) return null;
      return { version, url: getMacOSDownloadUrl(version) };
    }
    case PlatformTarget.windows_amd64: {
      const platform = release.platforms.find(
        p => p.platform === 'Windows' && hasArchitecture(p, 'x86_64')
      );
      if (!platform) return null;
      return {
        version,
        url: `https://download.swift.org/swift-${version}-release/windows10/swift-${version}-RELEASE/swift-${version}-RELEASE-windows10.exe`,
      };
    }
  }
}

async function getAvailableVersionCandidates(target: PlatformTarget): Promise<VersionCandidate[]> {
  const response = await fetch('https://www.swift.org/api/v1/install/releases.json');
  const releases: SwiftRelease[] = await response.json();

  const candidates: VersionCandidate[] = [];

  for (const release of releases) {
    const parts = release.name.split('.');
    // Only include releases with 3-part version numbers (major.minor.patch)
    if (parts.length === 3 && parts.every((p: string) => /^\d+$/.test(p))) {
      const major = parseInt(parts[0]);
      if (major >= 5) {
        const candidate = getVersionCandidate(release, target);
        if (candidate) {
          candidates.push(candidate);
        }
      }
    }
  }

  return candidates.sort((a, b) => compareVersionsDescending(a.version, b.version));
}

export async function getSwiftReleases(target: PlatformTarget): Promise<Release[]> {
  const candidates = await getAvailableVersionCandidates(target);

  // Group by era (major.minor) and keep the latest patch version for each era
  const releasesByEra: Record<string, Release> = {};

  for (const { version, url } of candidates) {
    const era = getEra(version);

    // Skip if we already have a release for this era (we want the newest)
    if (releasesByEra[era]) {
      continue;
    }

    releasesByEra[era] = {
      id: `swift-${version}`,
      name: `swift`,
      version: version,
      era: era,
      supported: true,
      url: url,
      target: target,
      size: 0,
    };
  }

  // Sort by era in descending order (newest first)
  return Object.values(releasesByEra).sort(
    (a, b) => b.era.localeCompare(a.era, undefined, { numeric: true, sensitivity: 'base' })
  );
}
