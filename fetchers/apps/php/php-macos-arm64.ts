import { Release, PlatformTarget } from '../../../types/release';

const PHP_VERSION = /php-(\d+\.\d+\.\d+)-Win32-[^-]+-x64\.zip/gi;

export async function getReleases(): Promise<Release[]> {
	const byEra = new Map<string, { version: string; url: string }>();
	const base = 'https://windows.php.net/downloads/releases/archives/';
	const res = await fetch(base);
	if (!res.ok) throw new Error('Failed to fetch PHP Windows archives');
	const body = await res.text();

	PHP_VERSION.lastIndex = 0;
	let m: RegExpExecArray | null;
	while ((m = PHP_VERSION.exec(body)) !== null) {
		const version = m[1];
		const [major, minor] = version.split('.');
		if (!major || minor === undefined) continue;

		const majorNum = parseInt(major, 10);
		const minorNum = parseInt(minor, 10);
		if (Number.isNaN(majorNum) || Number.isNaN(minorNum)) continue;

		if (majorNum < 5 || (majorNum === 5 && minorNum < 6)) continue;

		const era = `${majorNum}.${minorNum}`;
		const url = `https://www.php.net/distributions/php-${version}.tar.gz`;

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
			target: PlatformTarget.macos_arm64
		} as Release))
		.sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));
}
