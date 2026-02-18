import { Release, PlatformTarget } from '../types/release';

// Fetches available Perl versions from official Perl download page
export async function getReleases(): Promise<Release[]> {

	// Fetch Perl download page
	const response = await fetch('https://www.cpan.org/src/5.0/');

	if (!response.ok) {
		throw new Error('Failed to fetch Perl download page');
	}

	const html = await response.text();
	const regex = /perl-(\d+\.\d+\.\d+)\.(tar\.gz|tar\.bz2)/g;

	// Map to keep the best format for each version
	const formatMap = new Map<string, string>();

	let match: RegExpExecArray | null;
	while ((match = regex.exec(html))) {
		const version = match[1];
		const format = match[2];
		if (!formatMap.has(version) || format === 'tar.gz') {
			formatMap.set(version, format);
		}
	}

	// Use era as array key for deduplication
	const releases: Record<string, Release> = {};

	for (const [version, format] of formatMap) {
		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;
		const url = `https://www.cpan.org/src/5.0/perl-${version}.${format}`;

		// Check if the file exists
		const checkRes = await fetch(url, { method: 'HEAD' });
		if (!checkRes.ok) continue;

		// Overwrite if version is newer for this era
		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `perl-${era}`,
				name: 'Perl',
				version,
				era,
				supported: true,
				platforms: [
					{
						target: PlatformTarget.linux_amd64,
						url: url
					},
					{
						target: PlatformTarget.linux_arm64,
						url: url
					},
					{
						target: PlatformTarget.windows_amd64,
						url: url
					},
					{
						target: PlatformTarget.macos_amd64,
						url: url
					}
				]
			};
		}
	}

	if (!releases) {
		throw new Error('Failed to fetch Perl releases');
	}

	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));

	return sortedReleases;
}
