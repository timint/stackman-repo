import { Release, PlatformTarget } from '../../types/release';

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

		const findFile = (os: string, arch: string) => release.files.find((f: any) => f.os === os && f.arch === arch)?.filename;
		const linuxAmd64 = findFile('linux', 'amd64');

		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `go-${era}`,
				name: 'Go',
				version,
				era,
				supported: true,
				url: linuxAmd64 ? `https://go.dev/dl/${linuxAmd64}` : '',
				target: PlatformTarget.linux_amd64
			};
		}
	}

	return Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));
}
