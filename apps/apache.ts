import { Release, PlatformTarget } from '../types/release';

// Fetches available Apache versions from the official Apache HTTPD download page
export async function getReleases(): Promise<Release[]> {
	// Download the Apache HTTPD directory listing from archive
	const response = await fetch('https://archive.apache.org/dist/httpd/');

	if (!response.ok) {
		throw new Error('Failed to fetch Apache download page');
	}

	const html = await response.text();
	const regex = /(\d+\.\d+\.\d+)/g;
	const seen = new Set<string>();
	// Use era as array key for deduplication
	const releases: Record<string, Release> = {};

	const winMatch = /href="([^"]+win64\.zip)"/.exec(html);

	let match: RegExpExecArray | null;
	while ((match = regex.exec(html))) {
		const version = match[1];
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;
		if (seen.has(version)) continue;
		seen.add(version);

		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;

		// Overwrite if version is newer for this era
		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `apache-${era}`,
				name: 'Apache HTTP Server',
				version,
				era,
				supported: true,
				platforms: [
					{
						target: PlatformTarget.linux_arm64,
						url: `https://archive.apache.org/dist/httpd/httpd-${version}.tar.gz`
					},
					{
						target: PlatformTarget.linux_amd64,
						url: `https://archive.apache.org/dist/httpd/httpd-${version}.tar.gz`
					},
					{
						target: PlatformTarget.macos_arm64,
						url: `https://archive.apache.org/dist/httpd/httpd-${version}.tar.gz`
					},
					{
						target: PlatformTarget.macos_amd64,
						url: `https://archive.apache.org/dist/httpd/httpd-${version}.tar.gz`
					},
					{
						target: PlatformTarget.windows_amd64,
						url: winMatch ? `https://www.apachelounge.com${winMatch[1]}` : ''
					},
				]
			};
		}
	}

	// Convert releases object to array and sort by era (descending)
	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));

	return sortedReleases;
}
