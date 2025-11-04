import 'dotenv/config';
import { addDays, subDays, addMonths } from 'date-fns';

import { db } from '@/db';
import {
  organizations,
  users,
  memberships,
  vehicles,
  serviceEvents,
  odometerLogs,
  documents,
  reminders,
  notifications,
  tireStocks,
} from '@/db/schema';
import type { Insertable } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

async function main() {
  console.info('Șterg datele existente…');
  await db.execute(
    sql`TRUNCATE TABLE notifications, reminders, documents, odometer_logs, service_events, vehicles, memberships, organizations, users RESTART IDENTITY CASCADE`,
  );

  const now = new Date();
  const orgId = crypto.randomUUID();

  const [ownerId, adminId, mechanicId] = Array.from({ length: 3 }, () => crypto.randomUUID());

  const usersData: Insertable<typeof users>[] = [
    {
      id: ownerId,
      name: 'Ana Popescu',
      email: 'ana.owner@example.com',
      image: null,
    },
    {
      id: adminId,
      name: 'Mihai Ionescu',
      email: 'mihai.admin@example.com',
      image: null,
    },
    {
      id: mechanicId,
      name: 'Ioan Stancu',
      email: 'ioan.mech@example.com',
      image: null,
    },
  ];

  const orgData: Insertable<typeof organizations> = {
    id: orgId,
    name: 'FleetCare Demo SRL',
  };

  const membershipsData: Insertable<typeof memberships>[] = [
    {
      orgId,
      userId: ownerId,
      role: 'OWNER',
    },
    {
      orgId,
      userId: adminId,
      role: 'ADMIN',
    },
    {
      orgId,
      userId: mechanicId,
      role: 'MECHANIC',
    },
  ];

  const vehiclesData: Insertable<typeof vehicles>[] = [
    {
      id: crypto.randomUUID(),
      orgId,
      type: 'CAR',
      make: 'Dacia',
      model: 'Duster',
      year: 2022,
      vin: 'UU1HJDAG123456789',
      licensePlate: 'B-123-ABC',
      currentOdometerKm: '32500',
      lastOilChangeDate: subDays(now, 90),
      lastRevisionDate: subDays(now, 200),
      nextRevisionAtKm: '35000',
      nextRevisionDate: addDays(now, 30),
      insuranceProvider: 'Allianz Țiriac',
      insurancePolicyNumber: 'AT-RO-2024-001',
      insuranceEndDate: addDays(now, 25),
      status: 'DUE_SOON',
    },
    {
      id: crypto.randomUUID(),
      orgId,
      type: 'CAR',
      make: 'Volkswagen',
      model: 'Passat',
      year: 2021,
      vin: 'WVWZZZ3CZME012345',
      licensePlate: 'B-456-XYZ',
      currentOdometerKm: '80500',
      lastOilChangeDate: subDays(now, 200),
      lastRevisionDate: subDays(now, 380),
      nextRevisionAtKm: '78000',
      nextRevisionDate: subDays(now, 10),
      insuranceProvider: 'Groupama',
      insurancePolicyNumber: 'GRP-789-RO',
      insuranceEndDate: subDays(now, 12),
      status: 'OVERDUE',
    },
    {
      id: crypto.randomUUID(),
      orgId,
      type: 'CAR',
      make: 'Tesla',
      model: 'Model 3',
      year: 2023,
      vin: '5YJ3E1EA7KF317000',
      licensePlate: 'IF-99-TES',
      currentOdometerKm: '15800',
      lastOilChangeDate: null,
      lastRevisionDate: subDays(now, 60),
      nextRevisionAtKm: '30000',
      nextRevisionDate: addDays(now, 180),
      insuranceProvider: 'Omniasig',
      insurancePolicyNumber: 'OM-123-TES',
      insuranceEndDate: addDays(now, 120),
      status: 'OK',
    },
    {
      id: crypto.randomUUID(),
      orgId,
      type: 'TRUCK',
      make: 'Scania',
      model: 'R450',
      year: 2020,
      vin: 'YS2R4X20002134567',
      licensePlate: 'B-88-SCN',
      currentOdometerKm: '420500',
      lastOilChangeDate: subDays(now, 45),
      lastRevisionDate: subDays(now, 170),
      nextRevisionAtKm: '425000',
      nextRevisionDate: addDays(now, 5),
      insuranceProvider: 'Generali',
      insurancePolicyNumber: 'GEN-TRK-420',
      insuranceEndDate: addDays(now, 60),
      hasHeavyTonnageAuthorization: true,
      tachographCheckDate: subDays(now, 5),
      status: 'DUE_SOON',
    },
    {
      id: crypto.randomUUID(),
      orgId,
      type: 'TRUCK',
      make: 'Volvo',
      model: 'FH16',
      year: 2019,
      vin: 'YV2XTY0A9JB003456',
      licensePlate: 'B-45-VOL',
      currentOdometerKm: '510800',
      lastOilChangeDate: subDays(now, 10),
      lastRevisionDate: subDays(now, 120),
      nextRevisionAtKm: '515000',
      nextRevisionDate: addDays(now, 12),
      insuranceProvider: 'Allianz Țiriac',
      insurancePolicyNumber: 'AT-TRK-515',
      insuranceEndDate: addDays(now, 200),
      hasHeavyTonnageAuthorization: false,
      tachographCheckDate: addDays(now, 20),
      status: 'OK',
    },
    {
      id: crypto.randomUUID(),
      orgId,
      type: 'TRUCK',
      make: 'MAN',
      model: 'TGX',
      year: 2018,
      vin: 'WMA06XZZ7JP123456',
      licensePlate: 'B-77-MAN',
      currentOdometerKm: '598200',
      lastOilChangeDate: subDays(now, 260),
      lastRevisionDate: subDays(now, 420),
      nextRevisionAtKm: '590000',
      nextRevisionDate: subDays(now, 40),
      insuranceProvider: 'Uniqa',
      insurancePolicyNumber: 'UNI-MAN-598',
      insuranceEndDate: addDays(now, 10),
      hasHeavyTonnageAuthorization: true,
      tachographCheckDate: subDays(now, 365 + 5),
      status: 'OVERDUE',
    },
  ];

  const [duster, passat, tesla, scania, volvo, man] = vehiclesData;

  const serviceEventsData: Insertable<typeof serviceEvents>[] = [
    {
      id: crypto.randomUUID(),
      vehicleId: duster.id!,
      type: 'REVISION',
      date: subDays(now, 200),
      odometerKm: '28000',
      notes: 'Revizie completă',
      costAmount: '1200',
      costCurrency: 'RON',
      createdBy: mechanicId,
    },
    {
      id: crypto.randomUUID(),
      vehicleId: passat.id!,
      type: 'OIL_CHANGE',
      date: subDays(now, 210),
      odometerKm: '76000',
      notes: 'Schimb ulei și filtre',
      costAmount: '650',
      costCurrency: 'RON',
      createdBy: mechanicId,
    },
    {
      id: crypto.randomUUID(),
      vehicleId: scania.id!,
      type: 'REVISION',
      date: subDays(now, 170),
      odometerKm: '405000',
      nextDueDate: addDays(now, 5),
      nextDueKm: '425000',
      notes: 'Revizie tahograf și sistem frânare',
      costAmount: '4200',
      costCurrency: 'RON',
      createdBy: mechanicId,
    },
    {
      id: crypto.randomUUID(),
      vehicleId: volvo.id!,
      type: 'INSPECTION',
      date: subDays(now, 90),
      odometerKm: '500000',
      notes: 'Verificare anuală',
      costAmount: '2100',
      costCurrency: 'RON',
      createdBy: mechanicId,
    },
    {
      id: crypto.randomUUID(),
      vehicleId: man.id!,
      type: 'REPAIR',
      date: subDays(now, 45),
      odometerKm: '593000',
      notes: 'Înlocuit discuri frână',
      costAmount: '3800',
      costCurrency: 'RON',
      createdBy: mechanicId,
    },
    {
      id: crypto.randomUUID(),
      vehicleId: tesla.id!,
      type: 'INSPECTION',
      date: subDays(now, 60),
      odometerKm: '12000',
      notes: 'Verificare software și frâne regenerative',
      costAmount: '0',
      costCurrency: 'RON',
      createdBy: mechanicId,
    },
  ];

  const odometerLogsData: Insertable<typeof odometerLogs>[] = vehiclesData.flatMap((vehicle) => {
    const start = subDays(now, 180);
    return [0, 60, 120, 180].map((offset) => ({
      id: crypto.randomUUID(),
      vehicleId: vehicle.id!,
      date: addDays(start, offset),
      valueKm: (Number(vehicle.currentOdometerKm ?? '0') - (180 - offset) * 50).toString(),
      source: offset === 0 ? 'IMPORT' : 'MANUAL',
    }));
  });

  const documentsData: Insertable<typeof documents>[] = vehiclesData.flatMap((vehicle) => {
    const expiresBase = vehicle.insuranceEndDate ?? addMonths(now, 6);
    return [
      {
        id: crypto.randomUUID(),
        vehicleId: vehicle.id!,
        kind: 'INSURANCE',
        fileName: `${vehicle.licensePlate}-rca.pdf`,
        fileUrl: `https://public.blob.vercel-storage.com/demo/${vehicle.licensePlate.toLowerCase()}-rca.pdf`,
        uploadedBy: adminId,
        expiresAt: vehicle.insuranceEndDate,
      },
      {
        id: crypto.randomUUID(),
        vehicleId: vehicle.id!,
        kind: 'ITP',
        fileName: `${vehicle.licensePlate}-itp.pdf`,
        fileUrl: `https://public.blob.vercel-storage.com/demo/${vehicle.licensePlate.toLowerCase()}-itp.pdf`,
        uploadedBy: adminId,
        expiresAt: addMonths(expiresBase, 6),
      },
      {
        id: crypto.randomUUID(),
        vehicleId: vehicle.id!,
        kind: 'REGISTRATION',
        fileName: `${vehicle.licensePlate}-talon.pdf`,
        fileUrl: `https://public.blob.vercel-storage.com/demo/${vehicle.licensePlate.toLowerCase()}-talon.pdf`,
        uploadedBy: adminId,
        expiresAt: null,
      },
    ];
  });

  const tireStocksData: Insertable<typeof tireStocks>[] = [
    {
      id: crypto.randomUUID(),
      orgId,
      size: '315/70 R22.5',
      brand: 'Michelin',
      notes: 'Axă față',
      quantity: 12,
      minQuantity: 4,
    },
    {
      id: crypto.randomUUID(),
      orgId,
      size: '385/65 R22.5',
      brand: 'Continental',
      notes: 'Semi-remorci',
      quantity: 8,
      minQuantity: 4,
    },
    {
      id: crypto.randomUUID(),
      orgId,
      size: '295/80 R22.5',
      brand: 'Goodyear',
      notes: 'Camioane mici',
      quantity: 6,
      minQuantity: 2,
    },
  ];

  const remindersData: Insertable<typeof reminders>[] = [
    {
      id: crypto.randomUUID(),
      vehicleId: scania.id!,
      kind: 'DATE',
      dueDate: addDays(now, 5),
      leadDays: 30,
      status: 'PENDING',
      channel: 'EMAIL',
    },
    {
      id: crypto.randomUUID(),
      vehicleId: volvo.id!,
      kind: 'DATE',
      dueDate: addDays(volvo.tachographCheckDate ?? now, 365),
      leadDays: 30,
      status: 'PENDING',
      channel: 'IN_APP',
    },
    {
      id: crypto.randomUUID(),
      vehicleId: man.id!,
      kind: 'DATE',
      dueDate: addDays(man.tachographCheckDate ?? now, 365),
      leadDays: 30,
      status: 'PENDING',
      channel: 'EMAIL',
    },
    {
      id: crypto.randomUUID(),
      vehicleId: passat.id!,
      kind: 'ODOMETER',
      dueKm: '80000',
      leadKm: 1000,
      status: 'PENDING',
      channel: 'EMAIL',
    },
  ];

  const notificationsData: Insertable<typeof notifications>[] = [
    {
      id: crypto.randomUUID(),
      userId: adminId,
      title: 'Revizie camion în curând',
      message: 'Camionul Scania R450 are revizie programată în 5 zile.',
      linkUrl: `/vehicule/${scania.id}`,
    },
    {
      id: crypto.randomUUID(),
      userId: ownerId,
      title: 'Asigurare expirată',
      message: 'Vehicle Volkswagen Passat are asigurarea expirată.',
      linkUrl: `/vehicule/${passat.id}`,
    },
  ];

  console.info('Inserare date demo…');
  await db.insert(users).values(usersData);
  await db.insert(organizations).values(orgData);
  await db.insert(memberships).values(membershipsData);
  await db.insert(vehicles).values(vehiclesData);
  await db.insert(tireStocks).values(tireStocksData);
  await db.insert(serviceEvents).values(serviceEventsData);
  await db.insert(odometerLogs).values(odometerLogsData);
  await db.insert(documents).values(documentsData);
  await db.insert(reminders).values(remindersData);
  await db.insert(notifications).values(notificationsData);

  console.info('Seed finalizat cu succes.');
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
