import { Release, PlatformTarget } from '../../../types/release';

export async function getReleases(): Promise<Release[]> {
  const response = await fetch('https://api.github.com/repos/ldc-developers/ldc/releases?per_page=100');
  if (!response.ok) throw new Error('Failed to fetch LDC releases');

  const releases = await response.json();

  const stableReleases = releases.filter((release: any) => {
    if (release.prerelease || release.draft) return false;
    if (!release.name || /alpha|beta|rc|pre|preview/i.test(release.name)) return false;
    return true;
  });

  const releasesByEra: Record<string, Release> = {};

  for (const release of stableReleases) {
    const version = release.name || release.tag_name;
    const match = version.match(/^(\d+\.\d+)/);
    if (!match) continue;

    const era = match[1];

    const asset = release.assets.find((asset: any) => asset.name.includes('linux-aarch64') && asset.name.endsWith('.tar.xz'));
    if (!asset) continue;

    if (!releasesByEra[era] || version.localeCompare(releasesByEra[era].version, undefined, { numeric: true }) > 0) {
      releasesByEra[era] = {
        id: `dlang-${era}`,
        name: 'LDC (D Language Compiler)',
        version,
        era,
        supported: null,
        url: asset.browser_download_url,
        target: PlatformTarget.linux_arm64
      };
    }
  }

  const sortedReleases = Object.values(releasesByEra).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));

  return sortedReleases;
}
