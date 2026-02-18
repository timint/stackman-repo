import { Release, PlatformTarget } from '../../types/release';

export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://www.cpan.org/src/5.0/');

	if (!response.ok) {
		throw new Error('Failed to fetch Perl download page');
	}

	const html = await response.text();
	const regex = /perl-(\d+\.\d+\.\d+)\.(tar\.gz|tar\.bz2)/g;

	const formatMap = new Map<string, string>();

	let match: RegExpExecArray | null;
	while ((match = regex.exec(html))) {
		const version = match[1];
		const format = match[2];
		if (!formatMap.has(version) || format === 'tar.gz') {
			formatMap.set(version, format);
		}
	}

	const releases: Record<string, Release> = {};

	for (const [version, format] of formatMap) {
		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;
		const url = `https://www.cpan.org/src/5.0/perl-${version}.${format}`;

		const checkRes = await fetch(url, { method: 'HEAD' });
		if (!checkRes.ok) continue;

		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `perl-${era}`,
				name: 'Perl',
				version,
				era,
				supported: true,
				url: url,
				target: PlatformTarget.linux_arm64
			};
		}
	}

	return Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));
}
