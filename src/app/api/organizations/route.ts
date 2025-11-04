import { errorResponse, jsonResponse } from '@/lib/api';
import { auth } from '@/lib/auth';
import { getDefaultOrg } from '@/lib/default-org';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ message: 'Autentificare necesară.' }, { status: 401 });
    }

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
