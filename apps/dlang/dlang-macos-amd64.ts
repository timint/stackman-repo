import { Release, PlatformTarget } from '../../types/release';

export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://github.com/dlang/dmd/releases');
	if (!response.ok) throw new Error('Failed to fetch DLang releases');

	const html = await response.text();
	const seen = new Set<string>();
	const releases: Record<string, Release> = {};

	const versionRegex = /v(\d+\.\d+\.\d+)/g;
	let match: RegExpExecArray | null;

	while ((match = versionRegex.exec(html)) !== null) {
		const version = match[1];
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;
		if (seen.has(version)) continue;
		seen.add(version);

		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;

		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `dlang-${era}`,
				name: 'D',
				version,
				era,
				supported: true,
				url: `https://github.com/dlang/dmd/releases/download/v${version}/dmd.stable.osx.tar.xz`,
				target: PlatformTarget.macos_amd64
			};
		}
	}

	return Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));
}
