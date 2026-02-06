import { Release, Architecture, Platform } from '../types/release';

// Fetches available MariaDB versions from the official MariaDB REST API
export async function getReleases(): Promise<Release[]> {

  const res = await fetch('https://downloads.mariadb.org/rest-api/mariadb/');
  if (!res.ok) throw new Error('Failed to fetch MariaDB releases');

  const data = await res.json();
  const releases: Release[] = [];

  // Get major releases
  const majorReleases = data.major_releases || [];

  // For each major release, fetch point releases
  for (const majorRelease of majorReleases) {
    const releaseId = majorRelease.release_id;

    const res2 = await fetch(`https://downloads.mariadb.org/rest-api/mariadb/${releaseId}/`);
    if (!res2.ok) continue;

    const releaseData = await res2.json();
    const releaseDataReleases = releaseData.releases || {};

    for (const pointReleaseId in releaseDataReleases) {
      const pointRelease = releaseDataReleases[pointReleaseId];
      const version = pointRelease.release_name;

      // Find a suitable tar.gz file for Linux
      const tarFile = pointRelease.files?.find((f: any) =>
        f.package_type === 'tar.gz' && f.os === 'Linux'
      );

      const url = tarFile?.file_download_url || '';
      const size = 0; // Size not readily available from API

      releases.push({
        name: `MariaDB ${version}`,
        version,
        era: version.split('.').slice(0, 2).join('.'),
        release_date: pointRelease.date_of_release || '',
        description: 'MariaDB Server',
        platforms: [
          {
            platform: Platform.linux,
            architecture: Architecture.x86,
            url,
            size
          },
          {
            platform: Platform.linux,
            architecture: Architecture.x64,
            url,
            size
          }
        ]
      });
    }
  }

  // Sort by version descending for convenience
  releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

  return releases;
}
