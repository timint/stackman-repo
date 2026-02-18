import { Release, PlatformTarget } from '../../types/release';

export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://dev.mysql.com/downloads/mysql/');
	if (!response.ok) throw new Error('Failed to fetch MySQL download page');

	const html = await response.text();
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

	const releases: Record<string, Release> = {};

	for (const version of versionSet) {
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;
		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;

		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `mysql-${era}`,
				name: 'MySQL Community Server',
				version,
				era,
				supported: true,
				url: `https://dev.mysql.com/get/Downloads/MySQL-${major}.${minor}/mysql-${version}-linux-glibc2.28-aarch64.tar.xz`,
				target: PlatformTarget.linux_arm64
			};
		}
	}

	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));

	return sortedReleases;
}
