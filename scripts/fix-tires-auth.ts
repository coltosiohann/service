import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const files = [
  'src/app/api/tires/stock/route.ts',
  'src/app/api/tires/consume/route.ts',
  'src/app/api/tires/stock/[id]/route.ts',
  'src/app/api/tires/stock/[id]/adjust/route.ts',
];

files.forEach((file) => {
  const filePath = join(process.cwd(), file);
  let content = readFileSync(filePath, 'utf-8');

  // Remove session declaration and auth check
  content = content.replace(
    /\s*const session = await auth\(\);\s*\n\s*\n\s*if \(!session\?\.user\?\.id\) \{\s*\n\s*return Response\.json\(\{ message: ['"]Autentificare necesar[ăâ]\.['"] \}, \{ status: 401 \}\);\s*\n\s*\}\s*\n/g,
    '\n    // Authentication disabled\n'
  );

  writeFileSync(filePath, content, 'utf-8');
  console.log(`✓ Fixed ${file}`);
});

console.log('\n✅ All tires routes fixed!');
