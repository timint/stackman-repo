import { Release, PlatformTarget } from '../types/release';

export async function getReleases(): Promise<Release[]> {
	const res = await fetch('https://dev.mysql.com/downloads/mysql/');
	if (!res.ok) throw new Error('Failed to fetch MySQL download page');
	const html = await res.text();

	const versionRegex = /MySQL Community Server\s+([0-9]+\.[0-9]+\.[0-9]+)/g;
	const versionSet = new Set<string>();
	let match: RegExpExecArray | null;
	while ((match = versionRegex.exec(html))) {
		const version = match[1];
		if (/^\d+\.\d+\.\d+$/.test(version)) {
			const major = Number(version.split('.')[0]);
			if (major >= 5) {
				versionSet.add(version);
			}
		}
	}

	const latestByEra: Record<string, string> = {};
	for (const version of versionSet) {
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;
		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;
		if (!latestByEra[era] || version.localeCompare(latestByEra[era], undefined, { numeric: true }) > 0) {
			latestByEra[era] = version;
		}
	}
	const releases: Release[] = [];
	for (const era in latestByEra) {
		const version = latestByEra[era];
		const [major, minor] = version.split('.').map(Number);
		const platforms: { target: PlatformTarget; url: string }[] = [
			{
				target: PlatformTarget.windows_amd64,
				url: `https://dev.mysql.com/get/Downloads/MySQL-${major}.${minor}/mysql-${version}-winx64.zip`
			},
			{
				target: PlatformTarget.linux_amd64,
				url: `https://dev.mysql.com/get/Downloads/MySQL-${major}.${minor}/mysql-${version}-linux-glibc2.28-x86_64.tar.xz`
			},
			{
				target: PlatformTarget.linux_arm64,
				url: `https://dev.mysql.com/get/Downloads/MySQL-${major}.${minor}/mysql-${version}-linux-glibc2.28-aarch64.tar.xz`
			}
		];
		releases.push({
			id: `mysql-${era}`,
			name: 'MySQL Community Server',
			version,
			era,
			endoflife: null,
			platforms
		});
	}

	if (!releases) {
		throw new Error('Failed to fetch MySQL releases');
	}

	return releases;
}
