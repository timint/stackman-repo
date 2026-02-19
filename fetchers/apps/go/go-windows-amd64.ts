import { Release, PlatformTarget } from '../../../types/release';

export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://go.dev/dl/?mode=json');
	if (!response.ok) throw new Error('Failed to fetch Go releases');

	const data = await response.json();
	const releases: Record<string, Release> = {};

	for (const release of data) {
		const version = release.version.replace(/^go/, '');
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;
		const [major, minor] = version.split('.');
		const era = `${major}.${minor}`;

		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `go-${era}`,
				name: 'Go',
				version,
				era,
				supported: null,
				url: `https://go.dev/dl/go${version}.windows-amd64.zip`,
				target: PlatformTarget.windows_amd64
			};
		}
	}

	return Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));
}
