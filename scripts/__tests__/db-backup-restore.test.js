'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { backup, restore, readSnapshot } = require('../db-backup-restore');

describe('db backup restore e2e', () => {
  let dir;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'traqora-backup-'));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('round-trips a snapshot through backup then restore', () => {
    const data = path.join(dir, 'db.json');
    const archive = path.join(dir, 'backup.json');
    fs.writeFileSync(
      data,
      JSON.stringify({ tables: [{ name: 'users', rows: [{ id: 1, wallet: 'GABC' }] }] }),
    );

    const backed = backup({ data, out: archive });
    expect(backed.ok).toBe(true);
    expect(backed.rows).toBe(1);

    fs.writeFileSync(data, JSON.stringify({ tables: [] }));
    const restored = restore({ backup: archive, data });
    expect(restored.ok).toBe(true);
    expect(readSnapshot(data).tables[0].rows[0].wallet).toBe('GABC');
  });

  it('fails when the snapshot is not a tables object', () => {
    const data = path.join(dir, 'bad.json');
    fs.writeFileSync(data, JSON.stringify({ nope: true }));
    expect(() => backup({ data, out: path.join(dir, 'out.json') })).toThrow(/tables array/);
  });
});
