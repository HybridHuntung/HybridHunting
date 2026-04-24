import { NextResponse } from 'next/server'
import { dispensariesToSync } from '@/lib/dispensaries'

export async function GET() {
  return NextResponse.json({ dispensaries: dispensariesToSync })
}