import { Release, PlatformTarget } from '../types/release';

// Fetches available Apache versions from the official Apache HTTPD download page
export async function getReleases(): Promise<Release[]> {

	// Download the Apache HTTPD directory listing
	const res = await fetch('https://downloads.apache.org/httpd/');
	if (!res.ok) throw new Error('Failed to fetch Apache download page');

	const html = await res.text();
	const regex = /httpd-([\d.]+)\.tar\.gz/g;
	const seen = new Set<string>();

	// Fetch Apache Lounge page for Windows binaries
	let loungeHtml = '';
	try {
		const loungeRes = await fetch('https://www.apachelounge.com/download/');
		if (loungeRes.ok) {
			loungeHtml = await loungeRes.text();
		}
	} catch {
	}

	// Also fetch archive for older versions
	let archiveHtml = '';
	try {
		const archiveRes = await fetch('https://archive.apache.org/dist/httpd/');
		if (archiveRes.ok) {
			archiveHtml = await archiveRes.text();
		}
	} catch {
	}

	const releases: Release[] = [];

	let match: RegExpExecArray | null;
	while ((match = regex.exec(html))) {
		const version = match[1];
		if (seen.has(version)) continue;
		seen.add(version);

		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;

		let linuxUrl = `https://downloads.apache.org/httpd/httpd-${version}.tar.gz`;
		let linuxRes = await fetch(linuxUrl, { method: 'HEAD' });
		if (!linuxRes.ok && archiveHtml) {
			const archiveRegex = new RegExp(`httpd-${version.replace(/\./g, '\\\\.')}\\.tar\\.gz`);
			if (archiveRegex.test(archiveHtml)) {
				linuxUrl = `https://archive.apache.org/dist/httpd/httpd-${version}.tar.gz`;
				linuxRes = await fetch(linuxUrl, { method: 'HEAD' });
			}
		}

		if (!linuxRes.ok) continue;

		const platforms = [
			{
				target: PlatformTarget.linux_amd64,
				url: linuxUrl
			},
			{
				target: PlatformTarget.macos_amd64,
				url: linuxUrl
			},
			{
				target: PlatformTarget.macos_arm64,
				url: linuxUrl
			}
		];

		releases.push({
			name: `Apache HTTP Server`,
			version,
			era,
			platforms
		});
	}

	// Also parse archive for older versions not found on main download page
	if (archiveHtml) {
		const archiveRegex = /httpd-([\d.]+)\.tar\.gz/g;
		let archiveMatch: RegExpExecArray | null;
		while ((archiveMatch = archiveRegex.exec(archiveHtml))) {
			const version = archiveMatch[1];
			if (seen.has(version)) continue;
			seen.add(version);

			const [major, minor] = version.split('.').map(Number);
			const era = `${major}.${minor}`;

			const linuxUrl = `https://archive.apache.org/dist/httpd/httpd-${version}.tar.gz`;
			const linuxRes = await fetch(linuxUrl, { method: 'HEAD' });
			if (!linuxRes.ok) continue;

			const platforms = [
				{
					target: PlatformTarget.linux_amd64,
					url: linuxUrl
				},
				{
					target: PlatformTarget.macos_amd64,
					url: linuxUrl
				},
				{
					target: PlatformTarget.macos_arm64,
					url: linuxUrl
				}
			];

			releases.push({
				name: `Apache HTTP Server`,
				version,
				era,
				platforms
			});
		}
	}

	// Sort by version descending for convenience
	releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

	return releases;
}
