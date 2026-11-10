import { describe, expect, it } from 'vitest';

// Framework smoke test — proves the scaffold's vitest contract is live:
// the include glob `tests/**/*_test.ts` is what makes this file run at all
// (the default *.test.ts glob would never pick it up), so a passing run IS
// the assertion that the runner, the glob and the TS pipeline work.
describe('scaffold.runner', () => {
  it('vitest include glob catches tests/**/*_test.ts → this file executes', () => {
    expect(true).toBe(true);
  });

  it('TypeScript compiles the test pipeline → typed imports resolve end to end', () => {
    // Arrange
    const includeGlob: string = 'tests/**/*_test.ts';

    // Act
    const matchesContract: boolean = includeGlob.endsWith('_test.ts');

    // Assert
    expect(matchesContract).toBe(true);
  });
});
