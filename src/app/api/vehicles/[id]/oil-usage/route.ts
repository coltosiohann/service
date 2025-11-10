import { NextRequest, NextResponse } from 'next/server';

import { listVehicleOilUsage } from '@/features/oil/service';
import { getDefaultOrg } from '@/lib/default-org';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const defaultOrg = await getDefaultOrg();
  const vehicleId = params.id;

  const usage = await listVehicleOilUsage(vehicleId, defaultOrg.id);

  return NextResponse.json({ usage });
}
