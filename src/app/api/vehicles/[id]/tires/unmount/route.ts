import { NextRequest, NextResponse } from 'next/server';

import { unmountTires } from '@/features/tires/service';
import { getDefaultOrg } from '@/lib/default-org';
import { ValidationError } from '@/lib/errors';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const defaultOrg = await getDefaultOrg();
  const vehicleId = params.id;

  try {
    const body = await request.json();

    await unmountTires({
      orgId: defaultOrg.id,
      vehicleId,
      stockId: body.stockId,
      date: body.date,
      odometerKm: body.odometerKm,
      notes: body.notes,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ message: error.message, errors: error.details }, { status: 400 });
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Eroare la demontarea anvelopelor.' },
      { status: 500 },
    );
  }
}
