import { parseAutofunEvents } from '../src/lib/parseAutofun';
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

describe('parseAutofunEvents', () => {
  it('extracts mint from real Autofun tx', () => {
    const fixturePath = path.join(__dirname, 'fixtures', 'tx_launch.json');
    const raw = fs.readFileSync(fixturePath, 'utf8');
    const tx = JSON.parse(raw).result;
    const events = parseAutofunEvents(tx);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].mint).toBe('4F8yEKNdZQ4F6tczn5dDYd7ZgE8qUZaPPNfAjf46vFUN');
  });
});
