import { Release, PlatformTarget } from '../types/release';

export async function getReleases(): Promise<Release[]> {
	const res = await fetch('https://www.postgresql.org/ftp/source/');
	if (!res.ok) throw new Error('Failed to fetch PostgreSQL download page');

	const html = await res.text();
	const regex = />v(\d+\.\d+\.\d+)\//g;
	const seen = new Set<string>();

	const releases: Release[] = [];

	let match: RegExpExecArray | null;
	while ((match = regex.exec(html))) {
		const version = match[1];
		if (seen.has(version)) continue;
		seen.add(version);

		const [major] = version.split('.').map(Number);
		const era = `${major}`;

		releases.push({
			name: `PostgreSQL Server`,
			version,
			era,
			platforms: [
				{
					target: PlatformTarget.linux_amd64,
					url: `https://ftp.postgresql.org/pub/source/v${version}/postgresql-${version}.tar.gz`
				},
				{
					target: PlatformTarget.macos_amd64,
					url: `https://ftp.postgresql.org/pub/source/v${version}/postgresql-${version}.tar.gz`
				},
				{
					target: PlatformTarget.macos_arm64,
					url: `https://ftp.postgresql.org/pub/source/v${version}/postgresql-${version}.tar.gz`
				},
				{
					target: PlatformTarget.windows_amd64,
					url: `https://get.enterprisedb.com/postgresql/postgresql-${version}-windows-x64-binaries.zip`
				}
			]
		});

	}

	releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

	return releases;
}
