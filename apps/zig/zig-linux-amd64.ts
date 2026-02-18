import { Release, PlatformTarget } from '../../types/release';

export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://ziglang.org/download/index.json');
	if (!response.ok) throw new Error('Failed to fetch Zig releases');

	const data = await response.json();
	const seen = new Set<string>();
	const releases: Record<string, Release> = {};

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

		if (!data[key]['x86_64-linux']) continue;

		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `zig-${era}`,
				name: 'Zig',
				version,
				era,
				supported: true,
				url: data[key]['x86_64-linux'].tarball,
				target: PlatformTarget.linux_amd64
			};
		}
	}

	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));

	return sortedReleases;
}
