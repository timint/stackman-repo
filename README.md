# StackMan Repo

A unified feed generator that aggregates release information from multiple software projects into a single JSON file. Built with Bun and TypeScript for high performance and type safety.

The feed is being updated daily by Github Actions, available here:
https://timint.github.io/stackman-repo/apps/linux-amd64.json
https://timint.github.io/stackman-repo/apps/linux-arm64.json
https://timint.github.io/stackman-repo/apps/macos-amd64.json
https://timint.github.io/stackman-repo/apps/macos-arm64.json
https://timint.github.io/stackman-repo/apps/windows-amd64.json

## Overview

This project automatically fetches the latest version information from various software projects and generates a consolidated feed (`public/*.json`) that can be consumed by applications, dashboards, or other systems that need up-to-date release data.

## Supported Applications



The generator currently supports 19 applications:

- **Web Servers**: Apache HTTP Server, Nginx, Caddy
- **Runtimes & Languages**: Bun, Node.js, Python, PHP, Ruby, Go, Java, Kotlin, Scala, Zig, DLang, Perl
- **Databases**: MariaDB, MySQL, PostgreSQL, MongoDB


## Features

- **Automated fetching**: Retrieves release data from official sources (GitHub APIs, official download pages, etc.)
- **Type-safe**: Built with TypeScript for reliable data structures
- **High performance**: Powered by Bun runtime for fast execution
- **Parallel processing**: Fetches all releases concurrently for optimal speed
- **Error handling**: Gracefully handles API failures and network errors
- **Sorted output**: Results are sorted alphabetically by application name
- **Comprehensive testing**: Includes test suite to verify all fetchers work correctly

## Prerequisites

- **Bun** >= 1.3.x
- **Node.js** (optional, for running Node-based scripts)

## Installation

```bash
# Clone the repository
git clone https://github.com/timint/stackman-repo.git
cd stackman-repo

# Install dependencies (if any are added in the future)
bun install
```

## Usage

### Generate the Feed

```bash
# Generate feeds (all apps and platforms)
bun run build

# Generate Apache only (all platforms)
bun run build apache

# Generate Linux apps only
bun run build linux

# Generate Linux ARM64 apps only (all apps)
bun run build linux-arm64
```

This will:
1. Load all fetcher modules from the `fetchers/apps/` directory
2. Fetch release data from all supported applications in parallel
3. Sort results alphabetically
4. Write the consolidated feed to `public/apps/*.json`

### Development Mode

```bash
# Watch mode for development
bun run dev
```

### Run Tests

```bash
# Run the test suite
bun test
```

## Project Structure

```
stackman-repo/
├── fetchers/                           # Fetcher modules
│   └── apps/                           # Individual application fetchers
│       ├── apache/                     # Apache HTTP Server fetchers
│       │   ├── apache-linux-amd64.ts   # Platform-specific fetcher
│       │   ├── apache-windows-amd64.ts # Platform-specific fetcher
│       │   └── ...
│       └── ...                         # Other applications
├── public/                             # Generated output
│   └── apps/                           # Unified releases feed
│       ├── linux-arm64.json            # Unified releases feed for all apps on ARM64
│       ├── windows-amd64.json          # Unified releases feed for all apps on Windows AMD64
│       └── ...
├── tests/                              # Test files
│   └── index.test.js                   # Integration tests
├── types/                              # TypeScript type definitions
│   └── release.ts                      # Release interface and enums
├── .github/
│   └── workflows/
│       └── publish.yml                # CI/CD workflow
├── index.ts                            # Main entry point and feed generator
├── package.json                        # Project configuration
└── tsconfig.json                       # TypeScript configuration
```

## Output Format

The generated `public/apps/*.json` files contains a JSON object with application names as keys:

```json
{
  "apache": [
    {
      "name": "Apache 2.4",
      "version": "2.4.66",
      "era": "2.4",
      "supported": true,
      "url": "https://downloads.apache.org/httpd/httpd-2.4.66.tar.gz",
      "target": "linux-amd64",
    },
    ...
  ],
  "bun": [...],
  "php": [...],
  ...
}
```

### Release Object Structure

Each release object contains:

- `name`: Full name of the release (e.g., "Apache 2.4.66")
- `version`: Version string (e.g., "2.4.66")
- `era`: Major/minor version (e.g., "2.4")
- `url`: Download URL for the release
- `target`: Operating system and architecture (linux-arm64, linux-amd64, windows-amd64, macos-amd64)

## Adding a New Fetcher

To add support for a new application:

1. Create a new TypeScript file in the `fetchers/apps/:appname/` directory. The file name should be the lowercase version of the application name.
2. Export a `getReleases()` function that returns `Promise<Release[]>`
3. Import the `Release` type from `../../types/release.ts`

Example:

```typescript
import { Release } from '../../types/release';

export async function getReleases(): Promise<Release[]> {
  const res = await fetch('https://api.example.com/releases');
  const data = await res.json();

  return data.map(release => ({
    name: 'App Name',
    version: release.version,
    era: release.version.split('.').slice(0, 2).join('.'),
    supported: true,
    url: release.download_url,
    target: 'linux-arm64',
  }));
}
```

The new fetcher will be automatically discovered and included in the feed.

## API Error Handling

If a fetcher encounters an error, it will return an error object instead of an array:

```json
{
  "appname": {
    "error": "Failed to fetch releases: API rate limit exceeded"
  }
}
```

## CI/CD

The project includes a GitHub Actions workflow (`.github/workflows/releases.yml`) that can be configured to automatically build and deploy the releases feed.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure all tests pass (`bun test`)
5. Submit a pull request

## Performance

The generator is optimized for speed:
- Parallel fetching of all releases
- Bun's native performance optimizations
- Minimal dependencies
- Efficient data processing

## Troubleshooting

### Build Fails

If the build fails, ensure:
- Bun is installed and version >= 1.3.0
- You have internet access (fetchers need to reach external APIs)
- All fetchers in `apps/` are valid TypeScript files

### Empty Feed

If the feed is empty or contains errors:
- Check individual fetcher modules for API changes
- Verify external APIs are accessible
- Review the error messages in the feed output

## Future Enhancements

Potential improvements:
- Add support for more applications
- Implement caching to reduce API calls
- Add version filtering and filtering by era
- Support for different output formats (CSV, XML)
- Web interface for browsing releases
- Historical version tracking
