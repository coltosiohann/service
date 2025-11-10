import { NextRequest, NextResponse } from 'next/server';

import { listOilStockMovements } from '@/features/oil/service';
import { getDefaultOrg } from '@/lib/default-org';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const defaultOrg = await getDefaultOrg();
  const stockId = params.id;

  const movements = await listOilStockMovements(stockId, defaultOrg.id);

  return NextResponse.json({ movements });
}
