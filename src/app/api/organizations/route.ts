import { errorResponse, jsonResponse } from '@/lib/api';
import { getDefaultOrg } from '@/lib/default-org';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Authentication disabled - return default organization
    const defaultOrg = await getDefaultOrg();

    return jsonResponse({
      organizations: [
        {
          orgId: defaultOrg.id,
          name: defaultOrg.name,
          role: 'OWNER',
        },
      ],
    });
  } catch (error) {
    return errorResponse(error);
  }
}
