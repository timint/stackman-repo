import { Release, Platform, Architecture } from '../types/release';

// Fetches available PHP versions from the official Windows PHP releases feed
export async function getReleases(): Promise<Release[]> {

  const res = await fetch('https://windows.php.net/downloads/releases/app-releases.json');
  if (!res.ok) throw new Error('Failed to fetch PHP app-releases.json');

  const releasesData = await res.json();
  const releases: Release[] = [];

  for (const version in releasesData) {
    const releaseData = releasesData[version];
    const actualVersion = releaseData.version || version;
    let bestZip = '';
    let bestScore = -1;

    for (const buildName in releaseData) {
      const buildData = releaseData[buildName];
      let zipPath = (buildData?.zip?.path || buildData?.zip || '') as string;
      let zipUrl = '';

      if (typeof zipPath === 'string' && (zipPath.startsWith('http://') || zipPath.startsWith('https://'))) {
        zipUrl = zipPath;
      } else if (zipPath) {
        zipUrl = `https://windows.php.net/downloads/releases/${zipPath}`;
      }

      if (!zipUrl || !zipUrl.toLowerCase().includes('x64')) continue;

      let score = 0;
      const bn = buildName.toLowerCase();
      const zu = zipUrl.toLowerCase();

      if (bn.includes('nts') || zu.includes('nts')) score += 3;
      else if (bn.includes('ts') || zu.includes('ts')) score += 2;

      if (bn.includes('vs17') || zu.includes('vs17')) score += 2;
      else if (bn.includes('vs16') || zu.includes('vs16')) score += 1;
      else if (bn.includes('vc15') || zu.includes('vc15')) score += 1;

      if (score > bestScore) {
        bestScore = score;
        bestZip = zipUrl;
      }
    }

    if (bestZip) {
      const era = actualVersion.split('.')[0];

      releases.push({
        name: `PHP ${era}`,
        version: actualVersion,
        era,
        release_date: '', // Not available from feed
        platforms: []
      });

      releases[releases.length - 1].platforms.push({
        platform: Platform.windows,
        architecture: Architecture.amd64,
        url: bestZip,
        size: 0
      });

      releases[releases.length - 1].platforms.push({
        platform: Platform.linux,
        architecture: Architecture.amd64,
        url: `https://www.php.net/distributions/php-${actualVersion}.tar.gz`,
        size: 0
      });

      releases[releases.length - 1].platforms.push({
        platform: Platform.macos,
        architecture: Architecture.aarch64,
        url: `https://www.php.net/distributions/php-${actualVersion}.tar.gz`,
        size: 0
      });
    }
  }

  releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

  return releases;
}
