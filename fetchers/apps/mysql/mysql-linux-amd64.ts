import { Release, PlatformTarget } from '../../../types/release';

export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://downloads.mysql.com/archives/community/');
	if (!response.ok) throw new Error('Failed to fetch MySQL archives page');

	const html = await response.text();
	const versionRegex = /MySQL-([5-9]\.[0-9]+\.[0-9]+)/g;

	const versionSet = new Set<string>();
	let match: RegExpExecArray | null;
	while ((match = versionRegex.exec(html))) {
		const version = match[1];
		versionSet.add(version);
	}

	const releases: Record<string, Release> = {};

	for (const version of versionSet) {

		if (version < '5.5') continue;
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;

		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;

		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `mysql-${era}`,
				name: 'MySQL Community Server',
				version,
				era,
				supported: null,
				url: `https://dev.mysql.com/get/Downloads/MySQL-${major}.${minor}/mysql-${version}-linux-glibc2.28-x86_64.tar.xz`,
				target: PlatformTarget.linux_amd64
			};
		}
	}

	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));

	return sortedReleases;
}
