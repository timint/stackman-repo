import { Release, PlatformTarget } from '../types/release';

// Fetches available Zig versions from the official Zig download page
export async function getReleases(): Promise<Release[]> {

	// Fetch Zig releases from the official Zig download page
	const response = await fetch('https://ziglang.org/download/index.json');

	if (!response.ok) {
		throw new Error('Failed to fetch Zig releases');
	}

	const data = await response.json();

	const seen = new Set<string>();
	// Use era as array key for deduplication
	const releases: Record<string, Release> = {};
	const versionMap: Record<string, string> = {};

	for (const key in data) {
		const version = key === 'master' ? data[key].version : key;
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;
		if (seen.has(version)) continue;
		seen.add(version);
		const versionParts = version.split('.').map(Number);
		const major = versionParts[0];
		const minor = versionParts[1] !== undefined ? versionParts[1] : 0;
		let era: string;
		if (major === 0) {
			era = '1';
		} else {
			era = `${major}.${minor}`;
		}
		// Overwrite if version is newer for this era
		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			versionMap[era] = key;
			releases[era] = {
				id: `zig-${era}`,
				name: 'Zig',
				version,
				era,
				supported: true,
				platforms: []
			};
		}
	}

	// Populate platforms for each era
	for (const era in releases) {
		const version = releases[era].version;
		const key = versionMap[era];
		const platforms = [];
		if (data[key]['x86_64-linux']) {
			platforms.push({
				target: PlatformTarget.linux_amd64,
				url: data[key]['x86_64-linux'].tarball
			});
		}
		if (data[key]['aarch64-linux']) {
			platforms.push({
				target: PlatformTarget.linux_arm64,
				url: data[key]['aarch64-linux'].tarball
			});
		}
		if (data[key]['x86_64-macos']) {
			platforms.push({
				target: PlatformTarget.macos_amd64,
				url: data[key]['x86_64-macos'].tarball
			});
		}
		if (data[key]['aarch64-macos']) {
			platforms.push({
				target: PlatformTarget.macos_arm64,
				url: data[key]['aarch64-macos'].tarball
			});
		}
		if (data[key]['x86_64-windows']) {
			platforms.push({
				target: PlatformTarget.windows_amd64,
				url: data[key]['x86_64-windows'].zip
			});
		}
		releases[era].platforms = platforms;
	}

	if (!releases) {
		throw new Error('Failed to fetch Zig releases');
	}
	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));

	return sortedReleases;
}
