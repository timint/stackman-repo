export enum PlatformTarget {
	linux_amd64 = 'linux-amd64',
	linux_arm64 = 'linux-arm64',
	macos_amd64 = 'macos-amd64',
	macos_arm64 = 'macos-arm64',
	windows_amd64 = 'windows-amd64',
}

export interface Release {
	id: string
	name: string
	version: string
	era: string
	endoflife: string|null
	platforms: Array<{
		target: PlatformTarget
		url: string
	}>
}
