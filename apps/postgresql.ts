import { Release, PlatformTarget } from '../types/release';

export async function getReleases(): Promise<Release[]> {
	// Fetch PostgreSQL versions from official API
	const response = await fetch('https://www.postgresql.org/versions.json');

	if (!response.ok) {
		throw new Error('Failed to fetch PostgreSQL versions');
	}

	const data = await response.json();

	// Use era as array key for deduplication
	const releases: Record<string, Release> = {};

	for (const version of data) {
		const versionStr = version.toString();
		const [major] = versionStr.split('.').map(Number);
		const era = `${major}`;

		// Overwrite if version is newer for this era
		if (!releases[era] || versionStr.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `postgresql-${era}`,
				name: 'PostgreSQL Server',
				version: versionStr,
				era,
				supported: true,
				platforms: [
					{
						target: PlatformTarget.linux_amd64,
						url: `https://ftp.postgresql.org/pub/source/v${versionStr}/postgresql-${versionStr}.tar.gz`
					},
					{
						target: PlatformTarget.linux_arm64,
						url: `https://ftp.postgresql.org/pub/source/v${versionStr}/postgresql-${versionStr}.tar.gz`
					},
					{
						target: PlatformTarget.macos_amd64,
						url: `https://ftp.postgresql.org/pub/source/v${versionStr}/postgresql-${versionStr}.tar.gz`
					},
					{
						target: PlatformTarget.macos_arm64,
						url: `https://ftp.postgresql.org/pub/source/v${versionStr}/postgresql-${versionStr}.tar.gz`
					}
				]
			};
		}
	}

	// Convert releases object to array and sort by era (descending)
	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));

	return sortedReleases;
}
