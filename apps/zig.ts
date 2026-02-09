import { Release, PlatformTarget } from '../types/release';

// Fetches available Zig versions from the official Zig download page
export async function getReleases(): Promise<Release[]> {

	const res = await fetch('https://ziglang.org/download/index.json');
	if (!res.ok) throw new Error('Failed to fetch Zig releases');

	const data = await res.json();
	const releases: Release[] = [];

	const seen = new Set<string>();
	for (const key in data) {
		const version = key === 'master' ? data[key].version : key;
		if (seen.has(version)) continue;
		seen.add(version);

		const versionParts = version.split('.').map(Number);
		const major = versionParts[0];
		const minor = versionParts[1] !== undefined ? versionParts[1] : 0;
		let era: string;
		let name: string;

		if (major === 0) {
			era = '1';
		} else {
			era = `${major}.${minor}`;
		}

		releases.push({
			name: 'Zig',
			version,
			era,
			platforms: []
		});

		const releaseData = data[key];

		if (releaseData['x86_64-windows']) {
			releases[releases.length - 1].platforms.push({
				target: PlatformTarget.windows_amd64,
				url: releaseData['x86_64-windows'].tarball
			});
		}

		if (releaseData['x86_64-linux']) {
			releases[releases.length - 1].platforms.push({
				target: PlatformTarget.linux_amd64,
				url: releaseData['x86_64-linux'].tarball
			});
		}

		if (releaseData['x86_64-macos']) {
			releases[releases.length - 1].platforms.push({
				target: PlatformTarget.macos_amd64,
				url: releaseData['x86_64-macos'].tarball
			});
		}

		if (releaseData['aarch64-macos']) {
			releases[releases.length - 1].platforms.push({
				target: PlatformTarget.macos_arm64,
				url: releaseData['aarch64-macos'].tarball
			});
		}
	}

	return releases;
}
