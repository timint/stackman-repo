import { Release, PlatformTarget } from '../../../types/release';

// Match TS x64 ZIP filenames like:
//   php-8.5.1-Win32-vs17-x64.zip
//   php-7.3.33-Win32-vc15-x64.zip
// (we intentionally ignore NTS here).
const TS_X64_FILE = /php-(\d+\.\d+\.\d+)-Win32-[^-]+-x64\.zip/gi;

export async function getReleases(): Promise<Release[]> {
	const byEra = new Map<string, { version: string; url: string }>();
	const base = 'https://downloads.php.net/~windows/releases/archives/';
	const res = await fetch(base);
	if (!res.ok) throw new Error('Failed to fetch PHP Windows releases');
	const body = await res.text();

	TS_X64_FILE.lastIndex = 0;
	let m: RegExpExecArray | null;
	while ((m = TS_X64_FILE.exec(body)) !== null) {
		const file = m[0];
		const version = m[1];
		const [major, minor] = version.split('.');
		if (!major || minor === undefined) continue;

		const majorNum = parseInt(major, 10);
		const minorNum = parseInt(minor, 10);
		if (Number.isNaN(majorNum) || Number.isNaN(minorNum)) continue;

		// Skip pre-5.6
		if (majorNum < 5 || (majorNum === 5 && minorNum < 6)) continue;

		const era = `${majorNum}.${minorNum}`;
		const url = base + file;

		const existing = byEra.get(era);
		if (!existing || version.localeCompare(existing.version, undefined, { numeric: true }) > 0) {
			byEra.set(era, { version, url });
		}
	}

	return Array.from(byEra.entries())
		.map(([era, { version, url }]) => ({
			id: `php-${era}`,
			name: 'PHP',
			version,
			era,
			supported: null,
			url,
			target: PlatformTarget.windows_amd64,
				size: null
		} as Release))
		.sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));
}
