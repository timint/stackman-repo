import { Release, Architecture, Platform } from '../types/release';

// Fetches available MariaDB versions from the official MariaDB REST API
export async function getReleases(): Promise<Release[]> {

  const res = await fetch('https://downloads.mariadb.org/rest-api/mariadb/');
  if (!res.ok) throw new Error('Failed to fetch MariaDB releases');

  const data = await res.json();
  const releases: Release[] = [];
  const seen = new Set<string>();

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

      if (seen.has(version)) continue;
      seen.add(version);

      const versionMatch = version.match(/(\d+\.\d+\.\d+)/);
      if (!versionMatch) continue;
      const numericVersion = versionMatch[1];

      const [major, minor] = numericVersion.split('.').map(Number);
      const era = `${major}.${minor}`;

      releases.push({
        name: `MariaDB ${era}`,
        version: numericVersion,
        era,
        release_date: pointRelease.date_of_release || '',
        platforms: [
          {
            platform: Platform.linux,
            architecture: Architecture.amd64,
            url: `https://downloads.mariadb.org/f/mariadb-${numericVersion}/bintar-linux-systemd-x86_64/mariadb-${numericVersion}-linux-systemd-x86_64.tar.gz`,
            size: 0
          },
          {
            platform: Platform.windows,
            architecture: Architecture.amd64,
            url: `https://downloads.mariadb.org/f/mariadb-${numericVersion}/winx64-packages/mariadb-${numericVersion}-winx64.zip`,
            size: 0
          },
          {
            platform: Platform.macos,
            architecture: Architecture.amd64,
            url: `https://downloads.mariadb.org/f/mariadb-${numericVersion}/macos-system-x86_64/mariadb-${numericVersion}-macos10.14-x86_64.tar.gz`,
            size: 0
          },
          {
            platform: Platform.macos,
            architecture: Architecture.aarch64,
            url: `https://downloads.mariadb.org/f/mariadb-${numericVersion}/macos-system-arm64/mariadb-${numericVersion}-macos13-arm64.tar.gz`,
            size: 0
          }
        ]
      });
    }
  }

  // Sort by version descending for convenience
  releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

  return releases;
}
