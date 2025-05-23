export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const AUTOFUN = 'autoUmixaMaYKFjexMpQuBpNYntgbkzCo2b1ZqUaAZ5';
const LIMIT_NEW = 800;
const redis = Redis.fromEnv();

const LAUNCH_DISCS = new Set([
  '99f15de116454a3d',      // old launch
  '43c9be0fb9292f7a',      // old launch_and_swap
  'd8027cbbd32ad830'       // NEW – observed in the wild
]);

function isAutofunLaunch(ix: unknown, sig?: string) {
  if (
    typeof ix !== 'object' || ix === null ||
    !('programId' in ix) ||
    !('data' in ix) ||
    !('accounts' in ix)
  ) return false;
  if ((ix as { programId: unknown }).programId !== AUTOFUN) return false;
  if (!(ix as { data: unknown }).data) return false;
  const disc = Buffer.from((ix as { data: string }).data, 'base64').subarray(0, 8).toString('hex');
  if (!LAUNCH_DISCS.has(disc)) {
    if (sig) console.log(`[skip] unknown disc ${disc} for sig ${sig}`);
    return false;
  }
  return true;
}

function extractMint(ix: unknown) {
  if (
    typeof ix !== 'object' || ix === null ||
    !('accounts' in ix)
  ) return undefined;
  // @ts-expect-error: runtime type checked
  return ix.accounts?.[3];
}

async function heliusTx(sig: string) {
  const url = `https://rpc.helius.xyz/?api-key=${process.env.HELIUS}`;
  const body = {
    jsonrpc: '2.0',
    id: 1,
    method: 'getTransaction',
    params: [sig, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }],
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data.result?.transaction?.message || {};
}

async function* sigWalker(program: string, startSig?: string) {
  let before = startSig;
  let page = 0;
  while (true) {
    const body = {
      jsonrpc: '2.0', id: 1, method: 'getSignaturesForAddress',
      params: [program, { limit: 1000, before }]
    };
    const { result: sigs = [] } = await fetch(
      `https://rpc.helius.xyz/?api-key=${process.env.HELIUS}`,
      { method: 'POST', body: JSON.stringify(body) }
    ).then(r => r.json());
    if (!sigs.length) break;
    page++;
    console.log(`[sigWalker] Page ${page} - ${sigs.length} signatures, before=${before}`);
    for (const s of sigs) yield s.signature;
    before = sigs[sigs.length - 1].signature;
  }
}

export async function POST(req: NextRequest) {
  if (process.env.CRON_PSK && req.headers.get('authorization') !== `Bearer ${process.env.CRON_PSK}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Optional: support ?sig=... for single launch debug
  const url = new URL(req.url);
  const testSig = url.searchParams.get('sig');

  const raw = await redis.get<unknown>('global');
  const stored = Array.isArray(raw) ? raw : [];
  const existing = new Set<string>(stored);

  // --- PATCH: If only 1 token is tracked, force full backfill by deleting lastSig ---
  if (existing.size <= 1) {
    await redis.del('lastSig');
    console.log('[cron] Only 1 token in global; deleted lastSig to force full backfill.');
  }

  let numNew = 0;
  let checked = 0;
  const mints: string[] = [];
  if (testSig) {
    // Debug: parse just one transaction
    const tx = await heliusTx(testSig);
    const instructions = tx.instructions || [];
    for (const [i, ix] of instructions.entries()) {
      const disc = ix.data ? Buffer.from(ix.data, 'base64').subarray(0, 8).toString('hex') : '';
      console.log(`[debug] ix[${i}]: programId=${ix.programId} disc=${disc} accounts=${JSON.stringify(ix.accounts)}`);
    }
    for (const ix of instructions) {
      if (isAutofunLaunch(ix, testSig)) {
        const mint = extractMint(ix);
        mints.push(mint);
        if (!existing.has(mint)) {
          existing.add(mint);
          numNew++;
        }
        break;
      }
    }
    await Promise.all([
      redis.set('global', Array.from(existing)),
      redis.set('lastSig', Date.now())
    ]);
    return NextResponse.json({ ok: true, numNew, tokens: existing.size, mints });
  }

  // Full walk
  const lastSig = await redis.get<string>('lastSig');
  for await (const sig of sigWalker(AUTOFUN, lastSig ?? undefined)) {
    if (numNew > LIMIT_NEW) break;
    const tx = await heliusTx(sig);
    const instructions = tx.instructions || [];
    for (const ix of instructions) {
      if (isAutofunLaunch(ix, sig)) {
        const mint = extractMint(ix);
        if (!existing.has(mint)) {
          existing.add(mint);
          numNew++;
          // Log every new mint found
          console.log(`[cron] Found new launch: mint=${mint}, sig=${sig}, total new=${numNew}`);
        }
        break; // Only the first launch per tx
      }
    }
    checked++;
    if (checked % 50 === 0) {
      console.log(`[cron] Checked ${checked} txs, found ${numNew} new launches so far`);
    }
  }
  await Promise.all([
    redis.set('global', Array.from(existing)),
    redis.set('lastSig', Date.now())
  ]);
  return NextResponse.json({
    ok: true,
    numNew,
    tokens: existing.size
  });
}

export const dynamic = 'force-dynamic';
