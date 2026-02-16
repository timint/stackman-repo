import { Release, PlatformTarget } from '../types/release';

// Fetches available Apache versions from the official Apache HTTPD download page
export async function getReleases(): Promise<Release[]> {

	// Download the Apache HTTPD directory listing
	const res = await fetch('https://downloads.apache.org/httpd/');

	if (!res.ok) {
		throw new Error('Failed to fetch Apache download page');
	}

	const html = await res.text();
	const regex = /(\d+\.\d+\.\d+)/g;
	const seen = new Set<string>();
	const releases: Release[] = [];

	const winMatch = /href="([^"]+win64\.zip)"/.exec(html);

	let match: RegExpExecArray | null;
	while ((match = regex.exec(html))) {
		const version = match[1];
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;
		if (seen.has(version)) continue;
		seen.add(version);

		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;

		releases.push({
			id: `apache-${era}`,
			name: `Apache HTTP Server`,
			version,
			era,
			endoflife: null,
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
		});
	}

	if (!releases) {
		throw new Error('Failed to fetch Apache releases');
	}

	releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

	return releases;
}
