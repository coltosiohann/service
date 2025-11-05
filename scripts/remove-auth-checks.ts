import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const files = [
  'src/app/api/documents/route.ts',
  'src/app/api/documents/[id]/route.ts',
  'src/app/api/reminders/route.ts',
  'src/app/api/service-events/[id]/route.ts',
  'src/app/api/tires/consume/route.ts',
  'src/app/api/tires/stock/route.ts',
  'src/app/api/tires/stock/[id]/adjust/route.ts',
  'src/app/api/tires/stock/[id]/route.ts',
  'src/app/api/vehicles/[id]/odometer-logs/route.ts',
  'src/app/api/vehicles/[id]/route.ts',
  'src/app/api/vehicles/[id]/service-events/route.ts',
];

files.forEach((file) => {
  const filePath = join(process.cwd(), file);
  let content = readFileSync(filePath, 'utf-8');

  // Remove auth import
  content = content.replace(/import \{ auth \} from '@\/lib\/auth';\n/g, '');

  // Remove session check and auth requirement
  content = content.replace(
    /const session = await auth\(\);\s*\n\s*\n\s*if \(!session\?\.user\?\.id\) \{\s*\n\s*return Response\.json\(\{ message: 'Autentificare necesară\.' \}, \{ status: 401 \}\);\s*\n\s*\}\s*\n\s*\n/g,
    '// Authentication disabled\n\n'
  );

  writeFileSync(filePath, content, 'utf-8');
  console.log(`✓ Fixed ${file}`);
});

console.log('\n✅ All auth checks removed!');
