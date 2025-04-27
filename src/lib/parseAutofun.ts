// src/lib/parseAutofun.ts

interface SolanaTx {
  transaction?: {
    message?: {
      instructions?: unknown[];
      accountKeys?: unknown[];
    };
    signatures?: string[];
  };
  meta?: unknown;
  slot?: number;
}

/**
 * Parse Autofun events from a Solana transaction object (Helius getTransaction result)
 * Returns an array of { mint, slot, signature }
 */
export function parseAutofunEvents(tx: unknown) {
  const t = tx as SolanaTx;
  const AUTOFUN_ID = 'autoUmixaMaYKFjexMpQuBpNYntgbkzCo2b1ZqUaAZ5';
  const instructions = t.transaction?.message?.instructions ?? [];
  const accountKeys = t.transaction?.message?.accountKeys ?? [];
  const events = [];
  for (const ix of instructions) {
    if (
      typeof ix === 'object' && ix !== null &&
      'programId' in ix &&
      ((ix as { programId?: unknown }).programId === AUTOFUN_ID ||
        (typeof (ix as { programId?: unknown }).programId === 'object' &&
         (ix as { programId?: { toString: () => string } }).programId?.toString() === AUTOFUN_ID))
    ) {
      let mint: string | undefined = undefined;
      // Check for accounts array and accountKeys
      if ('accounts' in ix && Array.isArray((ix as { accounts?: unknown[] }).accounts) && accountKeys.length > 8) {
        const key = accountKeys[8];
        if (typeof key === 'object' && key !== null && 'pubkey' in key && typeof (key as { pubkey?: unknown }).pubkey === 'string') {
          mint = (key as { pubkey: string }).pubkey;
        } else if (typeof key === 'string') {
          mint = key;
        }
      }
      // fallback: grab the mint from logs if not found
      if (!mint && t.meta && typeof t.meta === 'object' && t.meta !== null && 'logMessages' in t.meta && Array.isArray((t.meta as { logMessages?: unknown[] }).logMessages)) {
        const mintLog = ((t.meta as { logMessages?: unknown[] }).logMessages ?? []).find(
          (msg: unknown) => typeof msg === 'string' && msg.startsWith('Program log: Mint: ')
        );
        if (typeof mintLog === 'string') {
          mint = mintLog.replace('Program log: Mint: ', '').trim();
        }
      }
      events.push({
        mint,
        slot: t.slot,
        signature: t.transaction?.signatures?.[0],
      });
    }
  }
  return events;
}
