import { NextResponse } from 'next/server';

const UPSTASH_REST_URL = process.env.UPSTASH_REST_URL!;
const UPSTASH_REST_TOKEN = process.env.UPSTASH_REST_TOKEN!;

export async function GET() {
  // Fetch the global state from Upstash KV
  const res = await fetch(`${UPSTASH_REST_URL}/get/global`, {
    headers: { Authorization: `Bearer ${UPSTASH_REST_TOKEN}` },
    cache: 'no-store',
  });
  if (!res.ok) return NextResponse.json({});
  const data = await res.json();
  let value = {};
  if (data.result) {
    try {
      value = JSON.parse(data.result);
    } catch {
      value = {};
    }
  }
  return NextResponse.json(value, {
    status: 200,
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=30',
    },
  });
}

export const dynamic = 'force-dynamic';
