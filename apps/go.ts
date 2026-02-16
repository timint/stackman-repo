import { Release, PlatformTarget } from '../types/release';

// Fetches available Go versions from the official Go download page
export async function getReleases(): Promise<Release[]> {

	const res = await fetch('https://go.dev/dl/?mode=json');
	if (!res.ok) throw new Error('Failed to fetch Go releases');

	const data = await res.json();
	const releases: Release[] = [];

	for (const release of data) {
		const version = release.version.replace(/^go/, '');
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;
		const era = `${version.split('.')[0]}.${version.split('.')[1]}`;

		releases.push({
			id: `go-${era}`,
			name: `Go ${version}`,
			version,
			era,
			endoflife: null,
			platforms: [
				{
					target: PlatformTarget.linux_amd64,
					url: `https://go.dev/dl/${release.files.find((f: any) => f.os === 'linux' && f.arch === 'amd64')?.filename}`
				},
				{
					target: PlatformTarget.linux_arm64,
					url: `https://go.dev/dl/${release.files.find((f: any) => f.os === 'linux' && f.arch === 'arm64')?.filename}`
				},
				{
					target: PlatformTarget.macos_amd64,
					url: `https://go.dev/dl/${release.files.find((f: any) => f.os === 'darwin' && f.arch === 'amd64')?.filename}`
				},
				{
					target: PlatformTarget.macos_arm64,
					url: `https://go.dev/dl/${release.files.find((f: any) => f.os === 'darwin' && f.arch === 'arm64')?.filename}`
				},
				{
					target: PlatformTarget.windows_amd64,
					url: `https://go.dev/dl/go${version}.windows-amd64.zip`
				}
			]
		});
	}

	if (!releases) {
		throw new Error('Failed to fetch Go releases');
	}

	releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

	return releases;
}
