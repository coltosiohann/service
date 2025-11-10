import { NextResponse } from 'next/server';

import { listAllOilMovements } from '@/features/oil/service';
import { getDefaultOrg } from '@/lib/default-org';

export async function GET() {
  const defaultOrg = await getDefaultOrg();

  const movements = await listAllOilMovements(defaultOrg.id);

  return NextResponse.json({ movements });
}
