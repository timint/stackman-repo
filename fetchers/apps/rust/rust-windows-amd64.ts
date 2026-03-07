
import { Release, PlatformTarget } from '../../../types/release';

export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://github.com/rust-lang/rust/tags');
	if (!response.ok) throw new Error('Failed to fetch Rust tags page');

	const html = await response.text();
	// Matches hrefs like: /rust-lang/rust/releases/tag/1.80.0
	const regex = /href="\/rust-lang\/rust\/releases\/tag\/([\d\.]+)"/g;

	const seen = new Set<string>();
	const releases: Record<string, Release> = {};

	let match: RegExpExecArray | null;
	while ((match = regex.exec(html))) {
		const version = match[1];

		if (seen.has(version)) continue;
		seen.add(version);

		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;

		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `rust-${era}`,
				name: 'Rust',
				version,
				era,
				supported: null,
				url: `https://static.rust-lang.org/dist/rust-${version}-x86_64-pc-windows-msvc.tar.gz`,
				target: PlatformTarget.windows_amd64,
				size: null
			};
		}
	}

	return Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));
}
