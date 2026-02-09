# StackMan Repo

A unified feed generator that aggregates release information from multiple software projects into a single JSON file. Built with Bun and TypeScript for high performance and type safety.

The feed is being updated daily by Github Actions, available here:
https://timint.github.io/stackman-repo/app-releases.json

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
# Build and generate the releases feed
bun run build
```

This will:
1. Load all fetcher modules from the `apps/` directory
2. Fetch release data from all supported applications in parallel
3. Sort results alphabetically
4. Write the consolidated feed to `public/releases.json`

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
├── apps/                    # Individual fetcher modules
│   ├── apache.ts            # Apache HTTP Server fetcher
│   ├── bun.ts               # Bun runtime fetcher
│   ├── php.ts               # PHP fetcher
│   └── ...                  # Other application fetchers
├── public/                  # Generated output
│   └── app-releases.json    # Unified releases feed
├── tests/                   # Test files
│   └── index.test.js        # Integration tests
├── types/                   # TypeScript type definitions
│   └── release.ts           # Release interface and enums
├── .github/
│   └── workflows/
│       └── releases.yml    # CI/CD workflow
├── index.ts                # Main entry point and feed generator
├── package.json            # Project configuration
└── tsconfig.json           # TypeScript configuration
```

## Output Format

The generated `public/app-releases.json` file contains a JSON object with application names as keys:

```json
{
  "apache": [
    {
      "name": "Apache 2.4",
      "version": "2.4.66",
      "era": "2.4",
      "platforms": [
        {
          "target": "linux-amd64",
          "url": "https://downloads.apache.org/httpd/httpd-2.4.66.tar.gz",
        }
      ]
    }
  ],
  "bun": [...],
  "php": [...]
}
```

### Release Object Structure

Each release object contains:

- `name`: Full name of the release (e.g., "Apache 2.4.66")
- `version`: Version string (e.g., "2.4.66")
- `era`: Major/minor version (e.g., "2.4")
- `platforms`: Array of platform-specific download information

### Platform Object Structure

- `target`: Operating system and architecture (linux-arm64, linux-amd64, windows-amd64, macos-amd64)
- `url`: Download URL for the release

## Adding a New Fetcher

To add support for a new application:

1. Create a new TypeScript file in the `apps/` directory (e.g., `newapp.ts`)
2. Export a `getReleases()` function that returns `Promise<Release[]>`
3. Import the `Release` type from `../types/release`

Example:

```typescript
import { Release } from '../types/release';

export async function getReleases(): Promise<Release[]> {
  const res = await fetch('https://api.example.com/releases');
  const data = await res.json();

  return data.map(release => ({
    name: 'App Name',
    version: release.version,
    era: release.version.split('.').slice(0, 2).join('.'),
    description: 'NewApp Description',
    platforms: [
      {
        target: 'linux-arm64',
        url: release.download_url,
      }
    ]
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
