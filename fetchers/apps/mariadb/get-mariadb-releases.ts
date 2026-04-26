import { PlatformTarget, Release } from '../../../types/release';

type MariaDbFile = {
	file_name?: string;
	file_download_url?: string;
	os?: string | null;
	cpu?: string | null;
	package_type?: string | null;
};

type MariaDbRelease = {
	release_name?: string;
	files?: MariaDbFile[];
};

type MariaDbReleaseResponse = {
	releases?: Record<string, MariaDbRelease>;
};

type TargetMatcher = {
	target: PlatformTarget;
	os: string;
	cpus: string[];
	fileNamePattern: RegExp;
	packageTypes: string[];
};

const RELEASES_API_URL = 'https://downloads.mariadb.org/rest-api/mariadb/';

const TARGET_MATCHERS: Record<PlatformTarget, TargetMatcher> = {
	[PlatformTarget.linux_amd64]: {
		target: PlatformTarget.linux_amd64,
		os: 'linux',
		cpus: ['x86_64'],
		fileNamePattern: /linux-systemd-x86_64\.tar\.gz$/i,
		packageTypes: ['gzipped tar file']
	},
	[PlatformTarget.linux_arm64]: {
		target: PlatformTarget.linux_arm64,
		os: 'linux',
		cpus: ['aarch64', 'arm64'],
		fileNamePattern: /(linux-systemd-(aarch64|arm64)|linux-(aarch64|arm64))\.tar\.gz$/i,
		packageTypes: ['gzipped tar file']
	},
	[PlatformTarget.macos_amd64]: {
		target: PlatformTarget.macos_amd64,
		os: 'osx',
		cpus: ['x86_64'],
		fileNamePattern: /(osx|macos).*(x86_64|amd64).*(\.tar\.gz|\.zip)$/i,
		packageTypes: ['gzipped tar file', 'zip file']
	},
	[PlatformTarget.macos_arm64]: {
		target: PlatformTarget.macos_arm64,
		os: 'osx',
		cpus: ['arm64', 'aarch64'],
		fileNamePattern: /(osx|macos).*arm64.*(\.tar\.gz|\.zip)$/i,
		packageTypes: ['gzipped tar file', 'zip file']
	},
	[PlatformTarget.windows_amd64]: {
		target: PlatformTarget.windows_amd64,
		os: 'windows',
		cpus: ['x86_64'],
		fileNamePattern: /winx64\.zip$/i,
		packageTypes: ['zip file']
	}
};

function getNumericVersion(releaseName: string | undefined): string | null {
	const versionMatch = releaseName?.match(/(\d+\.\d+\.\d+)/);
	return versionMatch ? versionMatch[1] : null;
}

function isPreview(version: string): boolean {
	return /preview|rc|alpha|beta|nightly/i.test(version);
}

function normalizePackageType(packageType: string | null | undefined): string {
	return (packageType ?? '').trim().toLowerCase();
}

function normalizeDownloadUrl(url: string): string {
	return url.replace(/^http:\/\//i, 'https://');
}

function selectFile(files: MariaDbFile[] | undefined, matcher: TargetMatcher): MariaDbFile | null {
	if (!files?.length) {
		return null;
	}

	return files.find(file => {
		const fileName = file.file_name ?? '';
		const os = (file.os ?? '').trim().toLowerCase();
		const cpu = (file.cpu ?? '').trim().toLowerCase();
		const packageType = normalizePackageType(file.package_type);
		const hasUrl = Boolean(file.file_download_url);

		return hasUrl
			&& os === matcher.os
			&& matcher.cpus.includes(cpu)
			&& matcher.packageTypes.includes(packageType)
			&& matcher.fileNamePattern.test(fileName);
	}) ?? null;
}

export async function getMariaDbReleases(target: PlatformTarget): Promise<Release[]> {
	const matcher = TARGET_MATCHERS[target];
	const response = await fetch(RELEASES_API_URL);
	if (!response.ok) {
		throw new Error('Failed to fetch MariaDB releases');
	}

	const data = await response.json() as { major_releases?: Array<{ release_id?: string }> };
	const majorReleases = data.major_releases ?? [];
	const releases: Record<string, Release> = {};

	for (const majorRelease of majorReleases) {
		const releaseId = majorRelease.release_id;
		if (!releaseId) {
			continue;
		}

		const releaseResponse = await fetch(`${RELEASES_API_URL}${releaseId}/`);
		if (!releaseResponse.ok) {
			continue;
		}

		const releaseData = await releaseResponse.json() as MariaDbReleaseResponse;

		for (const pointRelease of Object.values(releaseData.releases ?? {})) {
			const numericVersion = getNumericVersion(pointRelease.release_name);
			if (!numericVersion || isPreview(numericVersion)) {
				continue;
			}

			const selectedFile = selectFile(pointRelease.files, matcher);
			if (!selectedFile?.file_download_url) {
				continue;
			}

			const [major, minor] = numericVersion.split('.').map(Number);
			const era = `${major}.${minor}`;

			if (!releases[era] || numericVersion.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
				releases[era] = {
					id: `mariadb-${era}`,
					name: 'MariaDB Server',
					version: numericVersion,
					era,
					supported: null,
					url: normalizeDownloadUrl(selectedFile.file_download_url),
					target,
					size: null
				};
			}
		}
	}

	return Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));
}