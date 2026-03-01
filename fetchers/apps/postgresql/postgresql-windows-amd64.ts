import { Release, PlatformTarget } from '../../../types/release';

export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://www.postgresql.org/versions.json');
	if (!response.ok) throw new Error('Failed to fetch PostgreSQL versions');

	const data = await response.json();
	const releases: Record<string, Release> = {};

	for (const entry of data) {
		const major = entry.major;
		const era = `${major}`;

		if (major < 13) continue;

		if (!releases[era]) {
			releases[era] = {
				id: `postgresql-${era}`,
				name: 'PostgreSQL Server',
				version: `${major}.0.0`,
				era,
				supported: entry.supported || null,
				url: `https://get.enterprisedb.com/postgresql/postgresql-${major}-windows-x64-binaries.zip`,
				target: PlatformTarget.windows_amd64,
				size: null
			};
		}
	}

	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));

	return sortedReleases;
}
