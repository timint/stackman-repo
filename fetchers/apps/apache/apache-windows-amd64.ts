import { Release, PlatformTarget } from '../../../types/release';

export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://www.apachelounge.com/download/');
	if (!response.ok) {
		throw new Error('Failed to fetch Apache Lounge download page');
	}

	const html = await response.text();
	const regex = /httpd-(\d+\.\d+\.\d+)-(\d+)-Win64-VS\d\d\.zip/g;
	const seen = new Set<string>();
	const releases: Record<string, Release> = {};

	let match: RegExpExecArray | null;
	while ((match = regex.exec(html))) {
		const version = match[1];
		if (seen.has(version)) continue;
		seen.add(version);

		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;
		const url = `https://www.apachelounge.com/download/${match[0]}`;

		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `apache-${era}`,
				name: 'Apache HTTP Server',
				version,
				era,
				supported: null,
				url,
				target: PlatformTarget.windows_amd64
			};
		}
	}

	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));
	return sortedReleases;
}
