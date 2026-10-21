#!/usr/bin/env node
// scripts/check-migration-zero-downtime.js
//
// Migration zero-downtime policy (issue #704).
//
// Contract
// ────────
// Input  : TypeORM migration .ts sources
// Output : { ok, violations: [{ file, line, kind, snippet }] }
// Exit   : 0 when every up() is expand-only, 1 when a destructive up() is found
//
// Expand-only (allowed in up): ADD COLUMN, CREATE TABLE, CREATE INDEX.
// Destructive (forbidden in up unless the file contains
// `zero-downtime-exception:`): DROP TABLE, DROP COLUMN, RENAME COLUMN,
// ALTER COLUMN ... TYPE, SET NOT NULL without DEFAULT in the same statement.
// down() may drop objects; this scanner only inspects up().

'use strict';

const fs = require('fs');
const path = require('path');

const DESTRUCTIVE = [
  { kind: 'DROP_TABLE', re: /\bDROP\s+TABLE\b/i },
  { kind: 'DROP_COLUMN', re: /\bDROP\s+COLUMN\b/i },
  { kind: 'RENAME_COLUMN', re: /\bRENAME\s+COLUMN\b/i },
  { kind: 'ALTER_TYPE', re: /\bALTER\s+COLUMN\b[\s\S]{0,80}\bTYPE\b/i },
  { kind: 'SET_NOT_NULL', re: /\bSET\s+NOT\s+NULL\b/i },
];

function extractUpBody(source) {
  const match = source.match(/async\s+up\s*\([^)]*\)[^{]*\{([\s\S]*?)\n\s*\}/);
  return match ? match[1] : source;
}

function checkMigrationSource(source, file = 'migration.ts') {
  if (/zero-downtime-exception:/i.test(source)) {
    return { ok: true, violations: [] };
  }
  const up = extractUpBody(source);
  const violations = [];
  const lines = up.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    for (const rule of DESTRUCTIVE) {
      if (rule.re.test(lines[i])) {
        violations.push({
          file,
          line: i + 1,
          kind: rule.kind,
          snippet: lines[i].trim().slice(0, 160),
        });
      }
    }
  }
  return { ok: violations.length === 0, violations };
}

function listMigrationFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.ts'))
    .map((name) => path.join(dir, name));
}

function checkMigrationDir(dir) {
  const files = listMigrationFiles(dir);
  const violations = [];
  for (const file of files) {
    const result = checkMigrationSource(fs.readFileSync(file, 'utf8'), path.basename(file));
    violations.push(...result.violations);
  }
  return { ok: violations.length === 0, violations, scanned: files.length };
}

function main(argv = process.argv) {
  const dir =
    argv[2] ||
    path.join(__dirname, '..', 'packages', 'backend', 'src', 'db', 'migrations');
  const result = checkMigrationDir(dir);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.ok ? 0 : 1;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = {
  extractUpBody,
  checkMigrationSource,
  checkMigrationDir,
  main,
};
