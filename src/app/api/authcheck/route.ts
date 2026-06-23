/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticatedRequest } from '@/lib/userAuth';

export const dynamic = 'force-dynamic';

// TEMPORARY debug endpoint — remove before keeping in production.
export async function GET(req: NextRequest) {
  const out: any = { hasHeader: !!req.headers.get('authorization') };
  try {
    out.authenticated = await isAuthenticatedRequest(req);
  } catch (e: any) {
    out.error = String(e?.message || e);
  }
  return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
}
