"use client";
import React from 'react';
import Link from 'next/link';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

// Helper hook to fetch token meta (supply/decimals) for each mint
function useTokenMeta(mints: string[]) {
  const [meta, setMeta] = React.useState<Record<string, { supply: string|null, decimals: number|null }>>({});
  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      const results: Record<string, { supply: string|null, decimals: number|null }> = {};
      await Promise.all(mints.map(async (mint) => {
        try {
          const data = await fetch(`/api/token/${mint}`).then(r => r.json());
          results[mint] = { supply: data.supply, decimals: data.decimals };
        } catch {
          results[mint] = { supply: null, decimals: null };
        }
      }));
      if (!cancelled) setMeta(results);
    }
    if (mints.length > 0) load();
    return () => { cancelled = true; };
  }, [mints]);
  return meta;
}

export default function HomePage() {
  const { data, isLoading, error } = useSWR('/api/overview', fetcher, { refreshInterval: 20000 });
  const tokens: { mint: string }[] = Array.isArray(data)
    ? data.map((mint: string) => ({ mint }))
    : (data?.tokens || []);
  const mints = tokens.map(t => t.mint);
  const meta = useTokenMeta(mints);

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Autofun Token Dashboard</h1>
      {error && <div className="text-red-600">Error loading data.</div>}
      {isLoading && <div>Loading...</div>}
      <table className="w-full border mt-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Token</th>
            <th className="p-2">Supply</th>
            <th className="p-2">Decimals</th>
            <th className="p-2">Price</th>
            <th className="p-2">TVL</th>
            <th className="p-2">24h Vol</th>
            <th className="p-2">Buys/h</th>
            <th className="p-2">Sells/h</th>
          </tr>
        </thead>
        <tbody>
          {tokens.length === 0 && (
            <tr><td colSpan={8} className="text-center p-4">No tokens tracked yet.</td></tr>
          )}
          {tokens.map((t: { mint: string; symbol?: string }) => (
            <tr key={t.mint} className="border-t hover:bg-gray-50">
              <td className="p-2">
                <Link className="text-blue-600 underline" href={`https://solscan.io/token/${t.mint}`} target="_blank" rel="noopener noreferrer">{t.symbol || t.mint.slice(0, 6)}</Link>
              </td>
              <td className="p-2">{meta[t.mint]?.supply ?? <span className="text-gray-400">-</span>}</td>
              <td className="p-2">{meta[t.mint]?.decimals ?? <span className="text-gray-400">-</span>}</td>
              <td className="p-2">-</td>
              <td className="p-2">-</td>
              <td className="p-2">-</td>
              <td className="p-2">-</td>
              <td className="p-2">-</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-6 text-gray-500 text-sm">Auto-refreshes every 20s. Powered by Upstash, Helius, Raydium, and Vercel.</p>
    </main>
  );
}
