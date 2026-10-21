#!/usr/bin/env node
// scripts/db-backup-restore.js
//
// DB backup/restore e2e helper (issue #703).
//
// Contract
// ────────
// Input  : a JSON snapshot file used as the logical database dump
// Output : copy on backup; overwrite-restore on restore
// Exit   : 0 on success, 1 on missing files or invalid snapshot
//
// This is the file-based path used in CI and local drills. Production
// Postgres continues to use pg_dump/pg_restore as documented in
// docs/DEPLOYMENT_CHECKLIST.md.

'use strict';

const fs = require('fs');
const path = require('path');

function readSnapshot(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`snapshot not found: ${file}`);
  }
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !Array.isArray(parsed.tables)) {
    throw new Error('snapshot must be a JSON object with a tables array');
  }
  return parsed;
}

function writeSnapshot(file, snapshot) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
}

function backup({ data, out }) {
  const snapshot = readSnapshot(data);
  writeSnapshot(out, { ...snapshot, backedUpAt: new Date().toISOString() });
  return { ok: true, action: 'backup', rows: snapshot.tables.reduce((n, t) => n + (t.rows?.length || 0), 0) };
}

function restore({ backup: backupFile, data }) {
  const snapshot = readSnapshot(backupFile);
  writeSnapshot(data, {
    tables: snapshot.tables,
    restoredAt: new Date().toISOString(),
  });
  return { ok: true, action: 'restore', rows: snapshot.tables.reduce((n, t) => n + (t.rows?.length || 0), 0) };
}

function parseArgs(argv) {
  const args = { cmd: argv[2], data: null, out: null, backup: null };
  for (let i = 3; i < argv.length; i++) {
    if (argv[i] === '--data' && argv[i + 1]) args.data = argv[++i];
    else if (argv[i] === '--out' && argv[i + 1]) args.out = argv[++i];
    else if (argv[i] === '--backup' && argv[i + 1]) args.backup = argv[++i];
  }
  return args;
}

function main(argv = process.argv) {
  const args = parseArgs(argv);
  let result;
  if (args.cmd === 'backup') {
    if (!args.data || !args.out) throw new Error('backup requires --data and --out');
    result = backup({ data: args.data, out: args.out });
  } else if (args.cmd === 'restore') {
    if (!args.backup || !args.data) throw new Error('restore requires --backup and --data');
    result = restore({ backup: args.backup, data: args.data });
  } else {
    throw new Error('usage: db-backup-restore.js backup|restore ...');
  }
  process.stdout.write(`${JSON.stringify(result)}\n`);
  return 0;
}

if (require.main === module) {
  try {
    process.exit(main());
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
}

module.exports = { readSnapshot, backup, restore, main };
