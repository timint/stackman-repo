import { Release, PlatformTarget } from '../types/release';

// Fetches available DLang versions from GitHub releases
export async function getReleases(): Promise<Release[]> {
	const releases: Release[] = [];
	const seen = new Set<string>();

	const response = await fetch('https://github.com/dlang/dmd/releases');
	const html = await response.text();

	const versionRegex = /v(\d+\.\d+\.\d+)/g;
	let match;

	while ((match = versionRegex.exec(html)) !== null) {
		const version = match[1];

		if (seen.has(version)) {
			continue;
		}
		seen.add(version);

		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;

		releases.push({
			name: `D`,
			version,
			era,
			platforms: [
				{
					target: PlatformTarget.linux_amd64,
					url: `https://github.com/dlang/dmd/releases/download/v${version}/dmd.stable.linux.tar.xz`
				},
				{
					target: PlatformTarget.windows_amd64,
					url: `https://github.com/dlang/dmd/releases/download/v${version}/dmd.stable.windows.7z`
				},
				{
					target: PlatformTarget.macos_amd64,
					url: `https://github.com/dlang/dmd/releases/download/v${version}/dmd.stable.osx.tar.xz`
				},
				{
					target: PlatformTarget.macos_arm64,
					url: `https://github.com/dlang/dmd/releases/download/v${version}/dmd.stable.osx.tar.xz`
				}
			]
		});
	}

	return releases;
}
