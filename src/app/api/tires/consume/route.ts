
// This endpoint is deprecated - use /api/vehicles/[id]/tires/mount and unmount instead
// import { consumeTires } from '@/features/tires/service';
import { errorResponse, jsonResponse } from '@/lib/api';
// import { getDefaultOrgId } from '@/lib/default-org';

export async function POST() {
  try {
    // This endpoint is deprecated
    return jsonResponse({
      message: 'This endpoint is deprecated. Use /api/vehicles/[id]/tires/mount or unmount instead.'
    }, { status: 410 });
  } catch (error) {
    return errorResponse(error);
  }
}
