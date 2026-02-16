import { Release, PlatformTarget } from '../types/release';

// Fetches available Perl versions from official Perl download page
export async function getReleases(): Promise<Release[]> {

	const res = await fetch('https://www.cpan.org/src/5.0/');

	if (!res.ok) {
		throw new Error('Failed to fetch Perl download page');
	}

	const html = await res.text();
	const regex = /perl-(\d+\.\d+\.\d+)\.(tar\.gz|tar\.bz2)/g;
	const seen = new Set<string>();
	const formatMap = new Map<string, string>();

	let match: RegExpExecArray | null;
	while ((match = regex.exec(html))) {
		const version = match[1];
		const format = match[2];
		if (!formatMap.has(version) || format === 'tar.gz') {
			formatMap.set(version, format);
		}
	}

	const releases: Release[] = [];
	const latestByEra: Record<string, { version: string; format: string }> = {};

	for (const [version, format] of formatMap) {
		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;
		if (!latestByEra[era] || version.localeCompare(latestByEra[era].version, undefined, { numeric: true }) > 0) {
			latestByEra[era] = { version, format };
		}
	}

	for (const era in latestByEra) {
		const { version, format } = latestByEra[era];
		const url = `https://www.cpan.org/src/5.0/perl-${version}.${format}`;

		const checkRes = await fetch(url, { method: 'HEAD' });
		if (!checkRes.ok) continue;

		releases.push({
			id: `perl-${era}`,
			name: `Perl`,
			version,
			era,
			endoflife: null,
			platforms: [
				{
					target: PlatformTarget.linux_amd64,
					url
				},
				{
					target: PlatformTarget.linux_arm64,
					url
				},
				{
					target: PlatformTarget.windows_amd64,
					url
				},
				{
					target: PlatformTarget.macos_amd64,
					url
				},
				{
					target: PlatformTarget.macos_arm64,
					url
				}
			]
		});
	}

	if (!releases) {
		throw new Error('Failed to fetch Perl releases');
	}

	releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

	return releases;
}
