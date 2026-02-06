import { Release, PlatformTarget } from '../types/release';

// Fetches available MySQL versions from the official MySQL download page
export async function getReleases(): Promise<Release[]> {

	const res = await fetch('https://dev.mysql.com/downloads/mysql/');
	if (!res.ok) throw new Error('Failed to fetch MySQL download page');

	const html = await res.text();
	const regex = /MySQL Community Server ([\d.]+)/g;
	const seen = new Set<string>();

	const releases: Release[] = [];

	let match: RegExpExecArray | null;
	while ((match = regex.exec(html))) {
		const version = match[1];
		if (seen.has(version)) continue;
		seen.add(version);

		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;

		releases.push({
			name: `MySQL Server (Community Edition)`,
			version,
			era,
			platforms: [
			{
				target: PlatformTarget.linux_amd64,
				url: `https://dev.mysql.com/get/Downloads/MySQL-${era}/mysql-${version}-linux-glibc2.12-x86_64.tar.xz`
			},
			{
				target: PlatformTarget.windows_amd64,
				url: `https://dev.mysql.com/get/Downloads/MySQL-${era}/mysql-${version}-winx64.zip`
			},
			{
				target: PlatformTarget.macos_amd64,
				url: `https://dev.mysql.com/get/Downloads/MySQL-${era}/mysql-${version}-macos13-x86_64.tar.gz`
			},
			{
				target: PlatformTarget.macos_arm64,
				url: `https://dev.mysql.com/get/Downloads/MySQL-${era}/mysql-${version}-macos13-arm64.tar.gz`
			}
		]
		});

	}

	// Sort by version descending for convenience
	releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

	return releases;
}
