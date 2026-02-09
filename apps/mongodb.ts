import { Release, PlatformTarget } from '../types/release';

async function checkUrlExists(url: string): Promise<boolean> {
	try {
		const res = await fetch(url, { method: 'HEAD' });
		return res.ok;
	} catch {
		return false;
	}
}

export async function getReleases(): Promise<Release[]> {
	const res = await fetch('https://www.mongodb.com/try/download/community');
	if (!res.ok) throw new Error('Failed to fetch MongoDB Community download page');
	const html = await res.text();

	const versionMatches = html.matchAll(/\b(\d+\.\d+\.\d+)\b/g);
	const versionSet = new Set<string>();
	for (const match of versionMatches) {
		const version = match[1];
		if (/^\d+\.\d+\.\d+$/.test(version)) {
			versionSet.add(version);
		}
	}

	const versions = Array.from(versionSet).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

	if (versions.length === 0) throw new Error('No MongoDB versions found in page');

	const releases: Release[] = [];

	for (const version of versions) {
		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;

		const platforms: Array<{ target: PlatformTarget; url: string }> = [];

		const windowsUrl = `https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-${version}.zip`;
		if (await checkUrlExists(windowsUrl)) {
			platforms.push({ target: PlatformTarget.windows_amd64, url: windowsUrl });
		}

		const macosX64Url = `https://fastdl.mongodb.org/macos/mongodb-macos-x86_64-${version}.tgz`;
		if (await checkUrlExists(macosX64Url)) {
			platforms.push({ target: PlatformTarget.macos_amd64, url: macosX64Url });
		}

		const macosArm64Url = `https://fastdl.mongodb.org/macos/mongodb-macos-arm64-${version}.tgz`;
		if (await checkUrlExists(macosArm64Url)) {
			platforms.push({ target: PlatformTarget.macos_arm64, url: macosArm64Url });
		}

		const linuxUrls = [
			{ url: `https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu2204-${version}.tgz`, target: PlatformTarget.linux_amd64 },
			{ url: `https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu2404-${version}.tgz`, target: PlatformTarget.linux_amd64 },
			{ url: `https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-debian12-${version}.tgz`, target: PlatformTarget.linux_amd64 },
			{ url: `https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-rhel90-${version}.tgz`, target: PlatformTarget.linux_amd64 },
			{ url: `https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-amazon2023-${version}.tgz`, target: PlatformTarget.linux_amd64 },
		];

		for (const { url, target } of linuxUrls) {
			if (await checkUrlExists(url)) {
				platforms.push({ target, url });
				break;
			}
		}

		const linuxArm64Urls = [
			{ url: `https://fastdl.mongodb.org/linux/mongodb-linux-aarch64-ubuntu2204-${version}.tgz`, target: PlatformTarget.linux_arm64 },
			{ url: `https://fastdl.mongodb.org/linux/mongodb-linux-aarch64-ubuntu2404-${version}.tgz`, target: PlatformTarget.linux_arm64 },
			{ url: `https://fastdl.mongodb.org/linux/mongodb-linux-aarch64-debian12-${version}.tgz`, target: PlatformTarget.linux_arm64 },
			{ url: `https://fastdl.mongodb.org/linux/mongodb-linux-aarch64-rhel90-${version}.tgz`, target: PlatformTarget.linux_arm64 },
			{ url: `https://fastdl.mongodb.org/linux/mongodb-linux-aarch64-amazon2023-${version}.tgz`, target: PlatformTarget.linux_arm64 },
		];

		for (const { url, target } of linuxArm64Urls) {
			if (await checkUrlExists(url)) {
				platforms.push({ target, url });
				break;
			}
		}

		if (platforms.length > 0) {
			releases.push({
				name: 'MongoDB Community Server',
				version,
				era,
				platforms
			});
		}
	}

	return releases;
}
