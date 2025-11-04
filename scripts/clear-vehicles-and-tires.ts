import 'dotenv/config';

import { db, tireStocks, vehicles } from '@/db';

async function clearVehiclesAndTires() {
  await db.delete(tireStocks);
  await db.delete(vehicles);
}

clearVehiclesAndTires()
  .then(() => {
    console.log('✅ Vehiculele si anvelopele au fost sterse.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Nu s-a putut curata baza de date:', error);
    process.exit(1);
  });
