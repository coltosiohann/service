import { NextRequest, NextResponse } from 'next/server';

import { listStockMovements } from '@/features/tires/service';
import { getDefaultOrg } from '@/lib/default-org';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const defaultOrg = await getDefaultOrg();
  const stockId = params.id;

  const movements = await listStockMovements(stockId, defaultOrg.id);

  return NextResponse.json({ movements });
}
