import { NextRequest, NextResponse } from 'next/server';

import { getMountedTires } from '@/features/tires/service';
import { getDefaultOrg } from '@/lib/default-org';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const defaultOrg = await getDefaultOrg();
  const vehicleId = params.id;

  const mounted = await getMountedTires(vehicleId, defaultOrg.id);

  return NextResponse.json({ mounted });
}
