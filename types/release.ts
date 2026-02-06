export enum Platform {
  linux = 'linux',
  windows = 'windows',
  macos = 'macos',
}

export enum Architecture {
  x86 = 'x86',
  amd64 = 'amd64',
  aarch64 = 'aarch64',
}

export interface Release {
  name: string
  version: string
  era: string
  release_date: string
  platforms: Array<{
    platform: Platform | string
    architecture: Architecture | string
    url: string
    size: number
  }>
}
