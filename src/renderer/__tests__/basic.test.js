import { describe, it, expect } from 'vitest';

describe('Symphony Pro Studio Smoke Test', () => {
  it('should verify that the environment is correctly set up', () => {
    expect(true).toBe(true);
  });

  it('should verify project metadata', async () => {
    const pkg = await import('../../../package.json');
    expect(pkg.name).toBe('symphony-pro-studio');
    expect(pkg.author).toBe('Aniket Kumar');
  });
});
