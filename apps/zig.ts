import { Release, PlatformTarget } from '../types/release';

// Fetches available Zig versions from the official Zig download page
export async function getReleases(): Promise<Release[]> {

	const res = await fetch('https://ziglang.org/download/index.json');
	if (!res.ok) {
		throw new Error('Failed to fetch Zig releases');
	}

	const data = await res.json();
	const releases: Release[] = [];

	const seen = new Set<string>();
	const latestByEra: Record<string, string> = {};
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
		if (!latestByEra[era] || version.localeCompare(latestByEra[era], undefined, { numeric: true }) > 0) {
			latestByEra[era] = version;
			versionMap[era] = key;
		}
	}
	for (const era in latestByEra) {
		const version = latestByEra[era];
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
				url: data[key]['x86_64-windows'].tarball
			});
		}
		releases.push({
			id: `zig-${era}`,
			name: 'Zig',
			version,
			era,
			endoflife: null,
			platforms
		});
	}

	if (!releases) {
		throw new Error('Failed to fetch Zig releases');
	}

	return releases;
}
