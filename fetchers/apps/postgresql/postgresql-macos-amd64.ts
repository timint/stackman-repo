import { Release, PlatformTarget } from '../../../types/release';

export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://www.postgresql.org/versions.json');
	if (!response.ok) throw new Error('Failed to fetch PostgreSQL versions');

	const data = await response.json();
	const releases: Record<string, Release> = {};

	for (const entry of data) {
		const major = entry.major;
		const era = `${major}`;
		const versionStr = `${major}.0.0`;

		// Skip versions 8.0 and earlier as they don't have the v{major}.0 directory structure
		if (major < 8.1) continue;

		if (!releases[era]) {
			releases[era] = {
				id: `postgresql-${era}`,
				name: 'PostgreSQL Server',
				version: versionStr,
				era,
				supported: entry.supported || null,
				url: `https://ftp.postgresql.org/pub/source/v${major}.0/postgresql-${major}.0.tar.gz`,
				target: PlatformTarget.macos_amd64,
				size: null
			};
		}
	}

	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));

	return sortedReleases;
}
