import { Release, PlatformTarget } from '../types/release';

// Fetches available Go versions from the official Go download page
export async function getReleases(): Promise<Release[]> {
	// Fetch Go release metadata
	const response = await fetch('https://go.dev/dl/?mode=json');
	if (!response.ok) throw new Error('Failed to fetch Go releases');

	const data = await response.json();
	// Use era as array key for deduplication
	const releases: Record<string, Release> = {};

	for (const release of data) {
		const version = release.version.replace(/^go/, '');
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;
		const [major, minor] = version.split('.');
		const era = `${major}.${minor}`;

		const findFile = (os: string, arch: string) => release.files.find((f: any) => f.os === os && f.arch === arch)?.filename;
		const linuxAmd64 = findFile('linux', 'amd64');
		const linuxArm64 = findFile('linux', 'arm64');
		const macAmd64 = findFile('darwin', 'amd64');
		const macArm64 = findFile('darwin', 'arm64');

		// Overwrite if version is newer for this era
		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `go-${era}`,
				name: 'Go',
				version,
				era,
				endoflife: null,
				platforms: [
					{
						target: PlatformTarget.linux_amd64,
						url: linuxAmd64 ? `https://go.dev/dl/${linuxAmd64}` : ''
					},
					{
						target: PlatformTarget.linux_arm64,
						url: linuxArm64 ? `https://go.dev/dl/${linuxArm64}` : ''
					},
					{
						target: PlatformTarget.macos_amd64,
						url: macAmd64 ? `https://go.dev/dl/${macAmd64}` : ''
					},
					{
						target: PlatformTarget.macos_arm64,
						url: macArm64 ? `https://go.dev/dl/${macArm64}` : ''
					},
					{
						target: PlatformTarget.windows_amd64,
						url: `https://go.dev/dl/go${version}.windows-amd64.zip`
					}
				]
			};
		}
	}

	// Convert releases object to array and sort by era (descending)
	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));

	return sortedReleases;
}
