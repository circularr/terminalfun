import { NextRequest, NextResponse } from 'next/server';

// Fetch supply & decimals for a mint address from Solana RPC
async function getMintInfo(mint: string) {
  const url = `https://rpc.helius.xyz/?api-key=${process.env.HELIUS}`;
  const body = {
    jsonrpc: '2.0',
    id: 1,
    method: 'getAccountInfo',
    params: [mint, { encoding: 'jsonParsed' }]
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  const info = data.result?.value?.data?.parsed?.info;
  return {
    mint,
    supply: info?.supply ?? null,
    decimals: info?.decimals ?? null,
  };
}

export async function GET(request: NextRequest, context: unknown) {
  // Type guard for context and params
  if (
    typeof context !== 'object' ||
    context === null ||
    !('params' in context) ||
    typeof (context as { params?: unknown }).params !== 'object' ||
    (context as { params?: unknown }).params === null ||
    !('mint' in (context as { params: { mint?: unknown } }).params)
  ) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }
  const { params } = context as { params: { mint: string } };
  try {
    const meta = await getMintInfo(params.mint);
    return NextResponse.json(meta, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=60',
      },
    });
  } catch {
    return NextResponse.json({ mint: params.mint, supply: null, decimals: null }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
