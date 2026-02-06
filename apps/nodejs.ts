import { Release, PlatformTarget } from '../types/release';

// Fetches available Node.js versions from the official Node.js index.json
export async function getReleases(): Promise<Release[]> {

	const res = await fetch('https://nodejs.org/dist/index.json');
	if (!res.ok) throw new Error('Failed to fetch Node.js index.json');

	const data = await res.json();

	const releases: Release[] = [];

	for (const release of data) {
		const version = release.version.replace(/^v/, '');
		const era = version.split('.')[0];

		if (parseInt(era) < 12) continue;

		releases.push({
			name: `Node.js ${version}`,
			version,
			era,
			platforms: []
		});

		if (release.files.includes('win-x64')) {
			releases[releases.length - 1].platforms.push({
				target: PlatformTarget.windows_amd64,
				url: `https://nodejs.org/dist/v${version}/node-v${version}-win-x64.zip`
			});
		}

		if (release.files.includes('darwin-x64')) {
			releases[releases.length - 1].platforms.push({
				target: PlatformTarget.macos_amd64,
				url: `https://nodejs.org/dist/v${version}/node-v${version}-darwin-x64.tar.gz`
			});
		}

		if (release.files.includes('darwin-arm64')) {
			releases[releases.length - 1].platforms.push({
				target: PlatformTarget.macos_arm64,
				url: `https://nodejs.org/dist/v${version}/node-v${version}-darwin-arm64.tar.gz`
			});
		}

		if (release.files.includes('linux-x64')) {
			releases[releases.length - 1].platforms.push({
				target: PlatformTarget.linux_amd64,
				url: `https://nodejs.org/dist/v${version}/node-v${version}-linux-x64.tar.xz`
			});
		}
	}

	// Sort by version descending for convenience
	releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

	return releases;
}
