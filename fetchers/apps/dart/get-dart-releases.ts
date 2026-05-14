import { Release, PlatformTarget } from '../../../types/release';

const DART_ARCHIVE_BASE = 'https://storage.googleapis.com/dart-archive/channels/stable/release';

function getEra(version: string): string {
	const [major, minor] = version.split('.');
	return `${major}.${minor}`;
}

function compareVersionsDescending(a: string, b: string): number {
	return b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' });
}

async function getAvailableVersions(): Promise<string[]> {
	const response = await fetch('https://storage.googleapis.com/storage/v1/b/dart-archive/o?delimiter=%2F&prefix=channels%2Fstable%2Frelease%2F');
	if (!response.ok) {
		throw new Error('Failed to fetch Dart archive bucket listing');
	}

	const data = await response.json() as any;
	const versions = new Set<string>();

	// Extract versions from prefixes like "channels/stable/release/x.x.x/"
	if (data.prefixes && Array.isArray(data.prefixes)) {
		for (const prefix of data.prefixes) {
			const match = prefix.match(/channels\/stable\/release\/([0-9]+\.[0-9]+\.[0-9]+)\//);
			if (match) {
				const version = match[1];
				const parts = version.split('.');

				// Only accept versions with exactly 3 parts (major.minor.patch)
				if (parts.length === 3 && parts.every((p: string) => /^\d+$/.test(p))) {
					const major = parseInt(parts[0], 10);
					// Only accept versions 2.0.0 and above
					if (major >= 2) {
						versions.add(version);
					}
				}
			}
		}
	}

	if (versions.size === 0) {
		throw new Error('No stable versions (2+) found in dart-archive bucket');
	}

	return Array.from(versions).sort(compareVersionsDescending);
}

export async function getDartReleases(target: PlatformTarget): Promise<Release[]> {
	const versions = await getAvailableVersions();
	const releasesByEra: Record<string, Release> = {};

	for (const version of versions) {
		if (/preview|rc|alpha|beta|nightly/i.test(version)) {
			continue;
		}

		const era = getEra(version);
		const current = releasesByEra[era];
		if (current && version.localeCompare(current.version, undefined, { numeric: true, sensitivity: 'base' }) <= 0) {
			continue;
		}

		// Map PlatformTarget to Dart SDK naming conventions
		let platformName = '';
		let archName = '';

		switch (target) {
			case PlatformTarget.linux_amd64:
				platformName = 'linux';
				archName = 'x64';
				break;
			case PlatformTarget.linux_arm64:
				platformName = 'linux';
				archName = 'arm64';
				break;
			case PlatformTarget.macos_amd64:
				platformName = 'macos';
				archName = 'x64';
				break;
			case PlatformTarget.macos_arm64:
				platformName = 'macos';
				archName = 'arm64';
				break;
			case PlatformTarget.windows_amd64:
				platformName = 'windows';
				archName = 'x64';
				break;
		}

		const url = `${DART_ARCHIVE_BASE}/${version}/sdk/dartsdk-${platformName}-${archName}-release.zip`;

		releasesByEra[era] = {
			id: `dart-${era}`,
			name: 'Dart',
			version,
			era,
			supported: null,
			url,
			target,
			size: null
		};
	}

	return Object.values(releasesByEra).sort((a, b) => {
		// Sort by era in descending order (newest first)
		const cmp = a.era.localeCompare(b.era, undefined, { numeric: true });
		return cmp * -1; // Reverse to get descending
	});
}
