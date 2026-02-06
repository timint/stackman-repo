import { Release, PlatformTarget } from '../types/release';

// Fetches available Go versions from the official Go download page
export async function getReleases(): Promise<Release[]> {

	const res = await fetch('https://go.dev/dl/?mode=json');
	if (!res.ok) throw new Error('Failed to fetch Go releases');

	const data = await res.json();
	const releases: Release[] = [];

	for (const release of data) {
		const version = release.version.replace(/^go/, '');
		const era = `${version.split('.')[0]}.${version.split('.')[1]}`;

		releases.push({
			name: `Go ${version}`,
			version,
			era,
			release_date: release.release_date || '',
			platforms: []
		});

		const windowsFile = release.files?.find((f: any) => f.os === 'windows' && f.arch === 'amd64');
		if (windowsFile) {
			releases[releases.length - 1].platforms.push({
				target: PlatformTarget.windows_amd64,
				url: `https://go.dev/dl/go${version}.windows-amd64.zip`
			});
		}

		const macosFile = release.files?.find((f: any) => f.os === 'darwin' && f.arch === 'amd64' && f.kind === 'archive');
		if (macosFile) {
			releases[releases.length - 1].platforms.push({
				target: PlatformTarget.macos_amd64,
				url: `https://go.dev/dl/${macosFile.filename}`
			});
		}

		const macosArmFile = release.files?.find((f: any) => f.os === 'darwin' && f.arch === 'arm64' && f.kind === 'archive');
		if (macosArmFile) {
			releases[releases.length - 1].platforms.push({
				target: PlatformTarget.macos_arm64,
				url: `https://go.dev/dl/${macosArmFile.filename}`
			});
		}

		const linuxFile = release.files?.find((f: any) => f.os === 'linux' && f.arch === 'amd64' && f.kind === 'archive');
		if (linuxFile) {
			releases[releases.length - 1].platforms.push({
				target: PlatformTarget.linux_amd64,
				url: `https://go.dev/dl/${linuxFile.filename}`
			});
		}
	}

	releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

	return releases;
}
