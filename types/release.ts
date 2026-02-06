export enum PlatformTarget {
	windows_amd64 = 'windows-amd64',
	linux_amd64 = 'linux-amd64',
	linux_arm64 = 'linux-arm64',
	macos_amd64 = 'macos-amd64',
	macos_arm64 = 'macos-arm64',
}

export interface Release {
	name: string
	version: string
	era: string
	release_date: string
	platforms: Array<{
		target: PlatformTarget | string
		url: string
	}>
}
