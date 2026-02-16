import { Release, PlatformTarget } from '../types/release';

// Fetches available MariaDB versions from the official MariaDB REST API
export async function getReleases(): Promise<Release[]> {

	const res = await fetch('https://downloads.mariadb.org/rest-api/mariadb/');
	if (!res.ok) throw new Error('Failed to fetch MariaDB releases');

	const data = await res.json();
	const releases: Release[] = [];
	const seen = new Set<string>();
	const latestByEra: Record<string, string> = {};
	const releaseMap: Record<string, any> = {};
	const majorReleases = data.major_releases || [];
	for (const majorRelease of majorReleases) {
		const releaseId = majorRelease.release_id;
		const res2 = await fetch(`https://downloads.mariadb.org/rest-api/mariadb/${releaseId}/`);
		if (!res2.ok) continue;
		const releaseData = await res2.json();
		const releaseDataReleases = releaseData.releases || {};
		for (const pointReleaseId in releaseDataReleases) {
			const pointRelease = releaseDataReleases[pointReleaseId];
			const version = pointRelease.release_name;
			if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;
			if (seen.has(version)) continue;
			seen.add(version);
			const versionMatch = version.match(/(\d+\.\d+\.\d+)/);
			if (!versionMatch) continue;
			const numericVersion = versionMatch[1];
			const [major, minor] = numericVersion.split('.').map(Number);
			const era = `${major}.${minor}`;
			if (!latestByEra[era] || numericVersion.localeCompare(latestByEra[era], undefined, { numeric: true }) > 0) {
				latestByEra[era] = numericVersion;
				releaseMap[era] = pointRelease;
			}
		}
	}
	for (const era in latestByEra) {
		const numericVersion = latestByEra[era];
		const pointRelease = releaseMap[era];
		releases.push({
			id: `mariadb-${era}`,
			name: `MariaDB Server`,
			version: numericVersion,
			era,
			endoflife: null,
			platforms: [
				{
					target: PlatformTarget.linux_amd64,
					url: `https://downloads.mariadb.org/f/mariadb-${numericVersion}/bintar-linux-systemd-x86_64/mariadb-${numericVersion}-linux-systemd-x86_64.tar.gz`
				},
				{
					target: PlatformTarget.linux_arm64,
					url: `https://downloads.mariadb.org/f/mariadb-${numericVersion}/bintar-linux-systemd-aarch64/mariadb-${numericVersion}-linux-systemd-aarch64.tar.gz`
				},
				{
					target: PlatformTarget.windows_amd64,
					url: `https://downloads.mariadb.org/f/mariadb-${numericVersion}/winx64-packages/mariadb-${numericVersion}-winx64.zip`
				},
				{
					target: PlatformTarget.macos_amd64,
					url: `https://downloads.mariadb.org/f/mariadb-${numericVersion}/macos-system-x86_64/mariadb-${numericVersion}-macos10.14-x86_64.tar.gz`
				},
				{
					target: PlatformTarget.macos_arm64,
					url: `https://downloads.mariadb.org/f/mariadb-${numericVersion}/macos-system-arm64/mariadb-${numericVersion}-macos13-arm64.tar.gz`
				}
			]
		});
	}

	if (!releases) {
		throw new Error('Failed to fetch MariaDB releases');
	}

	releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

	return releases;
}
