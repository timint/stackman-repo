import { Release, PlatformTarget } from '../../../types/release';

export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://www.python.org/ftp/python/');
	if (!response.ok) throw new Error('Failed to fetch Python download page');

	const html = await response.text();
	const regex = /href="(\d+\.\d+\.\d+)\//g;

	const seen = new Set<string>();
	const releases: Record<string, Release> = {};

	let match: RegExpExecArray | null;
	while ((match = regex.exec(html))) {
		const version = match[1];

		if (seen.has(version)) continue;
		seen.add(version);

		const versionRes = await fetch(`https://www.python.org/ftp/python/${version}/`);
		if (!versionRes.ok) continue;
		const versionHtml = await versionRes.text();

		const hasAlpha = /Python-${version}a\d+\./.test(versionHtml) || /python-${version}a\d+\./.test(versionHtml);
		const hasBeta = /Python-${version}b\d+\./.test(versionHtml) || /python-${version}b\d+\./.test(versionHtml);
		const hasRC = /Python-${version}rc\d+\./.test(versionHtml) || /python-${version}rc\d+\./.test(versionHtml);

		if (hasAlpha || hasBeta || hasRC) {
			const hasStable = /Python-${version}\.(tgz|tar\.gz|tar\.xz)/.test(versionHtml) && !/Python-${version}[abr]\d+\./.test(versionHtml);
			if (!hasStable) continue;
		}

		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;

		if (major < 3 || (major === 3 && minor < 8)) continue;


		const embedUrl = `https://www.python.org/ftp/python/${version}/python-${version}-embed-amd64.zip`;
		const embedRes = await fetch(embedUrl, { method: 'HEAD' });

		if (embedRes.ok && (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0)) {
			releases[era] = {
				id: `python-${era}`,
				name: 'Python',
				version,
				era,
				supported: null,
				url: embedUrl,
				target: PlatformTarget.windows_amd64,
				size: null
			};
		}
	}

	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));

	return sortedReleases;
}
