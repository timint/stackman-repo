import { Release, PlatformTarget } from '../types/release';

// Fetches available MySQL versions from the official MySQL download page
export async function getReleases(): Promise<Release[]> {

	// Use the MySQL archive index for real, downloadable versions
	const res = await fetch('https://downloads.mysql.com/archives/community/');
	if (!res.ok) throw new Error('Failed to fetch MySQL archive page');
	const html = await res.text();
	// Find all version numbers in the archive dropdown
	const versionRegex = /option value="([\d.]+)"/g;
	const seen = new Set<string>();
	const releases: Release[] = [];
	let match: RegExpExecArray | null;
	while ((match = versionRegex.exec(html))) {
		const version = match[1];

		if (seen.has(version)) continue;

		seen.add(version);

		// Only allow major versions >= 5
		const major = Number(version.split('.')[0]);
		if (major < 5) continue;

		const versionParts = version.split('.').map(Number);
		const majorNum = versionParts[0];
		const minor = versionParts[1] !== undefined ? versionParts[1] : 0;
		const era = `${majorNum}.${minor}`;

		const platforms = [];

		if (version === '9.6.0') { // Skip 9.6.0 for Linux (no archive exists)
			platforms.push({
				target: PlatformTarget.linux_amd64,
				url: `https://downloads.mysql.com/archives/get/p/${version}/file/mysql-${version}-linux-glibc2.12-x86_64.tar.xz`
			});
		}
		platforms.push({
			target: PlatformTarget.windows_amd64,
			url: `https://downloads.mysql.com/archives/get/p/${version}/file/mysql-${version}-winx64.zip`
		});
		platforms.push({
			target: PlatformTarget.macos_amd64,
			url: `https://downloads.mysql.com/archives/get/p/${version}/file/mysql-${version}-macos13-x86_64.tar.gz`
		});
		platforms.push({
			target: PlatformTarget.macos_arm64,
			url: `https://downloads.mysql.com/archives/get/p/${version}/file/mysql-${version}-macos13-arm64.tar.gz`
		});
		releases.push({
			name: 'MySQL Server (Community Edition)',
			version,
			era,
			platforms
		});
	}

	releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
	return releases;
}
