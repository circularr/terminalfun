"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function TokenPage() {
  const params = useParams();
  const mint = Array.isArray(params?.mint) ? params.mint[0] : params?.mint;
  const { data, isLoading, error } = useSWR(mint ? `/api/token/${mint}` : null, fetcher, { refreshInterval: 20000 });

  if (!mint) return <div className="p-6">Invalid token mint.</div>;
  if (error) return <div className="p-6 text-red-600">Error loading token data.</div>;
  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!data) return <div className="p-6">No data for token.</div>;

  const { symbol, price, supply, tvl, volume24h, buysPerHour, sellsPerHour, history = [] } = data;

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <Link href="/" className="text-blue-600 underline">← Back to Dashboard</Link>
      <h1 className="text-2xl font-bold mt-4 mb-2">{symbol || mint}</h1>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div><span className="font-semibold">Price:</span> {price ?? '-'}</div>
        <div><span className="font-semibold">Supply:</span> {supply ?? '-'}</div>
        <div><span className="font-semibold">TVL:</span> {tvl ?? '-'}</div>
        <div><span className="font-semibold">24h Vol:</span> {volume24h ?? '-'}</div>
        <div><span className="font-semibold">Buys/h:</span> {buysPerHour ?? '-'}</div>
        <div><span className="font-semibold">Sells/h:</span> {sellsPerHour ?? '-'}</div>
      </div>
      <h2 className="text-lg font-semibold mb-2">Price vs. Time</h2>
      <div className="bg-white border rounded p-2" style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" tickFormatter={t => new Date(t).toLocaleTimeString()} />
            <YAxis domain={['auto', 'auto']} />
            <Tooltip labelFormatter={t => new Date(t).toLocaleString()} />
            <Line type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-6 text-gray-500 text-sm">Auto-refreshes every 20s. Powered by Upstash, Helius, Raydium, and Vercel.</p>
    </main>
  );
}
