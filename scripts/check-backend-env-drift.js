#!/usr/bin/env node
// scripts/check-backend-env-drift.js
//
// Backend env drift check (issue #702).
//
// Contract
// ────────
// Input  : env.example text + an actual env map (file or process.env)
// Output : { ok, missing, undocumented, declared } JSON on stdout
// Exit   : 0 when no required backend vars are missing, 1 otherwise
//
// A declared backend variable is an uncommented NAME= line in env.example
// after the "BACKEND CONFIGURATION" marker (or the whole file if the marker
// is absent). NEXT_PUBLIC_* keys are client-side and ignored.
//
// Missing  : declared key with no non-empty value in actual env and no
//            non-empty example default.
// Undocumented: keys present in an actual env *file* that are not declared
//            in env.example. process.env is not scanned for extras.

'use strict';

const fs = require('fs');
const path = require('path');

const SYSTEM_ENV = new Set([
  'PATH', 'PATHEXT', 'HOME', 'USERPROFILE', 'USERNAME', 'USER', 'SHELL', 'PWD',
  'TMP', 'TEMP', 'TMPDIR', 'COMSPEC', 'OS', 'NUMBER_OF_PROCESSORS', 'PROMPT',
  'TERM', 'TERM_PROGRAM', 'SHLVL', 'LANG', 'LC_ALL', 'EDITOR', 'VISUAL',
  'SSH_AUTH_SOCK', 'DISPLAY', 'HOSTNAME', 'HOSTTYPE', 'MACHTYPE', 'OSTYPE',
  'LOGNAME', 'MAIL', 'NODE', 'npm_config_user_agent',
]);

const ACTIVE_VAR = /^([A-Z][A-Z0-9_]*)=(.*)$/;
const BACKEND_MARKER = /BACKEND CONFIGURATION/i;

function parseDeclaredBackendVars(exampleText) {
  const lines = exampleText.split(/\r?\n/);
  const start = lines.findIndex((line) => BACKEND_MARKER.test(line));
  const slice = start >= 0 ? lines.slice(start) : lines;
  const declared = new Map();
  for (const raw of slice) {
    const line = raw.trim();
    const match = ACTIVE_VAR.exec(line);
    if (!match) continue;
    const [, name, value] = match;
    if (name.startsWith('NEXT_PUBLIC_')) continue;
    if (!declared.has(name)) {
      declared.set(name, value.trim());
    }
  }
  return declared;
}

function parseEnvFile(text) {
  const env = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const match = ACTIVE_VAR.exec(line);
    if (!match) continue;
    env[match[1]] = match[2];
  }
  return env;
}

function isSystemKey(name) {
  return SYSTEM_ENV.has(name) || name.startsWith('npm_') || name.startsWith('NPM_');
}

function checkBackendEnvDrift({ exampleText, actualEnv, scanUndocumented = false }) {
  const declared = parseDeclaredBackendVars(exampleText);
  const missing = [];
  for (const [name, exampleValue] of declared.entries()) {
    const actual = actualEnv[name];
    const hasActual = typeof actual === 'string' ? actual.trim() !== '' : actual != null && actual !== '';
    const hasDefault = exampleValue !== '' && !/^\(None/i.test(exampleValue);
    if (!hasActual && !hasDefault) {
      missing.push(name);
    }
  }

  const undocumented = [];
  if (scanUndocumented) {
    for (const name of Object.keys(actualEnv)) {
      if (!/^[A-Z][A-Z0-9_]*$/.test(name) || isSystemKey(name)) continue;
      if (name.startsWith('NEXT_PUBLIC_')) continue;
      if (!declared.has(name)) undocumented.push(name);
    }
    undocumented.sort();
  }

  return {
    ok: missing.length === 0,
    missing,
    undocumented,
    declared: [...declared.keys()],
  };
}

function parseArgs(argv) {
  const args = { example: path.join(__dirname, '..', 'env.example'), envFile: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--example' && argv[i + 1]) args.example = argv[++i];
    else if (argv[i] === '--env' && argv[i + 1]) args.envFile = argv[++i];
  }
  return args;
}

function main(argv = process.argv) {
  const args = parseArgs(argv);
  const exampleText = fs.readFileSync(args.example, 'utf8');
  if (!args.envFile) {
    const declared = [...parseDeclaredBackendVars(exampleText).keys()];
    const result = { ok: declared.length > 0, missing: [], undocumented: [], declared };
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return result.ok ? 0 : 1;
  }
  const actualEnv = parseEnvFile(fs.readFileSync(args.envFile, 'utf8'));
  const result = checkBackendEnvDrift({ exampleText, actualEnv, scanUndocumented: true });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.ok ? 0 : 1;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = {
  parseDeclaredBackendVars,
  parseEnvFile,
  checkBackendEnvDrift,
  main,
};
