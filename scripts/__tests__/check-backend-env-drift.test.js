'use strict';

const {
  parseDeclaredBackendVars,
  checkBackendEnvDrift,
} = require('../check-backend-env-drift');

const EXAMPLE = `
# CLIENT / FRONTEND CONFIGURATION
NEXT_PUBLIC_API_URL=http://localhost:3001

# BACKEND CONFIGURATION (packages/backend)
PORT=3001
NODE_ENV=development
JWT_SECRET=
# OPTIONAL_FEATURE=
`;

describe('backend env drift check', () => {
  it('parses uncommented backend keys and skips client keys', () => {
    const declared = parseDeclaredBackendVars(EXAMPLE);
    expect([...declared.keys()]).toEqual(['PORT', 'NODE_ENV', 'JWT_SECRET']);
  });

  it('passes when required keys are present or have defaults', () => {
    const result = checkBackendEnvDrift({
      exampleText: EXAMPLE,
      actualEnv: { JWT_SECRET: 'super-secret-value' },
    });
    expect(result.ok).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('fails when a required secret has no value and no default', () => {
    const result = checkBackendEnvDrift({
      exampleText: EXAMPLE,
      actualEnv: { PORT: '3001' },
    });
    expect(result.ok).toBe(false);
    expect(result.missing).toEqual(['JWT_SECRET']);
  });

  it('reports undocumented keys from an env file', () => {
    const result = checkBackendEnvDrift({
      exampleText: EXAMPLE,
      actualEnv: { JWT_SECRET: 'x', STRAY_BACKEND_FLAG: '1' },
      scanUndocumented: true,
    });
    expect(result.undocumented).toEqual(['STRAY_BACKEND_FLAG']);
  });
});
