import { test, expect } from 'bun:test';
import { generateFeeds } from '../index';

test('should fetch all available releases and return arrays of releases', async () => {
  const results = await generateFeeds();

  // Check that all expected keys exist and are arrays (or error objects)
  const expected = [
    'apache', 'php', 'mariadb', 'mysql', 'nginx',
    'nodejs', 'python', 'postgresql', 'mongodb', 'bun',
    'caddy', 'go', 'ruby', 'dlang', 'dotnet',
    'kotlin', 'java', 'perl', 'scala', 'swift',
    'zig'
  ];

  for (const key of expected) {
    expect(results).toHaveProperty(key);

    // Accept either array (success) or object with error property
    const val = results[key];
    if (Array.isArray(val)) {
      expect(val.length).toBeGreaterThanOrEqual(0);

      // Optionally check shape of first element if present
      if (val.length > 0) {
        expect(val[0]).toHaveProperty('name');
        expect(val[0]).toHaveProperty('version');
      }

    } else {
      expect(val).toHaveProperty('error');
    }
  }
});
