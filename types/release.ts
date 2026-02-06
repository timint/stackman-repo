export enum Platform {
  linux = 'linux',
  windows = 'windows',
  macos = 'macos',
}

export enum Architecture {
  x86 = 'x86',
  x64 = 'x64',
  arm64 = 'arm64',
}

export interface Release {
  name: string
  version: string
  era: string
  release_date: string
  description: string
  platforms: Array<{
    platform: Platform | string
    architecture: Architecture | string
    url: string
    size: number
  }>
}
