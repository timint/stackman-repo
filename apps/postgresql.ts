import { Release, PlatformTarget } from '../types/release';

export async function getReleases(): Promise<Release[]> {
	const res = await fetch('https://www.postgresql.org/versions.json');

	if (!res.ok) {
		throw new Error('Failed to fetch PostgreSQL versions');
	}

	const data = await res.json();
	const latestByEra: Record<string, string> = {};
	const releases: Release[] = [];

	for (const version of data) {
		const versionStr = version.toString();
		const [major] = versionStr.split('.').map(Number);
		const era = `${major}`;
		if (!latestByEra[era] || versionStr.localeCompare(latestByEra[era], undefined, { numeric: true }) > 0) {
			latestByEra[era] = versionStr;
		}
	}

	for (const era in latestByEra) {
		const versionStr = latestByEra[era];
		releases.push({
			id: `postgresql-${era}`,
			name: `PostgreSQL Server`,
			version: versionStr,
			era,
			endoflife: null,
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
		});
	}

	if (!releases) {
		throw new Error('Failed to fetch PostgreSQL releases');
	}

	releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

	return releases;
}
