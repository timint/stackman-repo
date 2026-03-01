import { Release, PlatformTarget } from '../../../types/release';

interface StaticPHPFile {
	full_path: string;
	name: string;
	size: string;
	last_modified: string;
	download_count: number;
	is_dir: boolean;
	is_parent: boolean;
}

const PHP_MACOS_AMD64_FILE = /^php-(\d+\.\d+\.\d+)-cli-macos-x86_64\.tar\.gz$/;

export async function getReleases(): Promise<Release[]> {
	const byEra = new Map<string, { version: string; url: string }>();
	const apiUrl = 'https://dl.static-php.dev/static-php-cli/common/?format=json';
	const res = await fetch(apiUrl);
	if (!res.ok) throw new Error('Failed to fetch static-php-cli releases');

	const files: StaticPHPFile[] = await res.json();

	for (const file of files) {
		if (file.is_dir || file.is_parent) continue;

		const match = file.name.match(PHP_MACOS_AMD64_FILE);
		if (!match) continue;

		const version = match[1];
		const [major, minor] = version.split('.');
		if (!major || minor === undefined) continue;

		const majorNum = parseInt(major, 10);
		const minorNum = parseInt(minor, 10);
		if (Number.isNaN(majorNum) || Number.isNaN(minorNum)) continue;

		if (majorNum < 8) continue;

		const era = `${majorNum}.${minorNum}`;
		const url = `https://dl.static-php.dev${file.full_path}`;

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
			target: PlatformTarget.macos_amd64
		} as Release))
		.sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));
}
