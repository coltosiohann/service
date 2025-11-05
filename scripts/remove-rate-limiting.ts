import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const files = [
  'src/app/api/vehicles/[id]/service-events/route.ts',
  'src/app/api/vehicles/[id]/route.ts',
  'src/app/api/vehicles/[id]/odometer-logs/route.ts',
  'src/app/api/service-events/[id]/route.ts',
  'src/app/api/tires/consume/route.ts',
  'src/app/api/documents/route.ts',
  'src/app/api/reminders/route.ts',
];

files.forEach((file) => {
  const filePath = join(process.cwd(), file);
  let content = readFileSync(filePath, 'utf-8');

  // Remove enforceRateLimit import
  content = content.replace(
    /import \{ (.+), enforceRateLimit \} from '@\/lib\/rate-limit';\n/g,
    (match, otherImports) => {
      if (otherImports.trim()) {
        return `import { ${otherImports} } from '@/lib/rate-limit';\n`;
      }
      return '';
    }
  );

  // Also handle case where it's the only import
  content = content.replace(/import \{ enforceRateLimit \} from '@\/lib\/rate-limit';\n/g, '');

  // Remove enforceRateLimit calls with session.user.id
  content = content.replace(
    /\s*enforceRateLimit\([^)]+session\.user\.id[^)]+\);\s*\n/g,
    ''
  );

  writeFileSync(filePath, content, 'utf-8');
  console.log(`✓ Fixed ${file}`);
});

console.log('\n✅ All rate limiting calls removed!');
