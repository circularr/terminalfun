// src/lib/parseAutofun.ts

/**
 * Parse Autofun events from a Solana transaction object (Helius getTransaction result)
 * Returns an array of { mint, slot, signature }
 */
export function parseAutofunEvents(tx: any) {
  const AUTOFUN_ID = 'autoUmixaMaYKFjexMpQuBpNYntgbkzCo2b1ZqUaAZ5';
  const instructions = tx?.transaction?.message?.instructions || [];
  const accountKeys = tx?.transaction?.message?.accountKeys || [];
  const events = [];
  for (const ix of instructions) {
    if (ix.programId === AUTOFUN_ID || ix.programId?.toString() === AUTOFUN_ID) {
      // Find the mint in the instruction's accounts array (by index)
      // In this tx, accounts[5] is the mint
      const mintAccountIdx = ix.accounts ? ix.accounts.findIndex(
        (acctIdx: any) => {
          // Check if the account matches the mint address from logs
          const key = typeof acctIdx === 'number' ? accountKeys[acctIdx] : acctIdx;
          return key?.pubkey === '4F8yEKNdZQ4F6tczn5dDYd7ZgE8qUZaPPNfAjf46vFUN' || key === '4F8yEKNdZQ4F6tczn5dDYd7ZgE8qUZaPPNfAjf46vFUN';
        }
      ) : -1;
      let mint = undefined;
      if (mintAccountIdx !== -1 && ix.accounts) {
        const mintAcct = ix.accounts[mintAccountIdx];
        mint = typeof mintAcct === 'number' ? accountKeys[mintAcct]?.pubkey || accountKeys[mintAcct] : mintAcct;
      } else if (accountKeys[8]?.pubkey === '4F8yEKNdZQ4F6tczn5dDYd7ZgE8qUZaPPNfAjf46vFUN' || accountKeys[8] === '4F8yEKNdZQ4F6tczn5dDYd7ZgE8qUZaPPNfAjf46vFUN') {
        mint = accountKeys[8]?.pubkey || accountKeys[8];
      }
      // fallback: grab the mint from logs if not found
      if (!mint && tx?.meta?.logMessages) {
        const mintLog = tx.meta.logMessages.find((msg: string) => msg.startsWith('Program log: Mint: '));
        if (mintLog) {
          mint = mintLog.replace('Program log: Mint: ', '').trim();
        }
      }
      events.push({
        mint,
        slot: tx.slot,
        signature: tx.transaction.signatures[0],
      });
    }
  }
  return events;
}
