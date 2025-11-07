import "dotenv/config";
import { addDays, addMonths, subDays } from "date-fns";
import { sql } from "drizzle-orm";

import { db } from "@/db";
import {
  documents,
  memberships,
  notifications,
  odometerLogs,
  organizations,
  reminders,
  serviceEvents,
  tireStocks,
  users,
  vehicles,
} from "@/db/schema";
import type { InferModel } from "drizzle-orm";

const toDate = (value: Date | null) => (value ? value.toISOString().slice(0, 10) : null);

async function main() {
  console.info("Sterg datele existente...");
  await db.execute(
    sql`TRUNCATE TABLE notifications, reminders, documents, odometer_logs, service_events, vehicles, memberships, organizations, users RESTART IDENTITY CASCADE`,
  );

  const now = new Date();
  const orgId = crypto.randomUUID();
  const [ownerId, adminId, mechanicId] = Array.from({ length: 3 }, () => crypto.randomUUID());

  const usersData: InferModel<typeof users, "insert">[] = [
    { id: ownerId, name: "Ana Popescu", email: "ana.owner@example.com", image: null },
    { id: adminId, name: "Mihai Ionescu", email: "mihai.admin@example.com", image: null },
    { id: mechanicId, name: "Ioan Stancu", email: "ioan.mech@example.com", image: null },
  ];

  const orgData: InferModel<typeof organizations, "insert"> = {
    id: orgId,
    name: "FleetCare Demo SRL",
  };

  const membershipsData: InferModel<typeof memberships, "insert">[] = [
    { orgId, userId: ownerId, role: "OWNER" },
    { orgId, userId: adminId, role: "ADMIN" },
    { orgId, userId: mechanicId, role: "MECHANIC" },
  ];

  const vehiclesData: InferModel<typeof vehicles, "insert">[] = [
    {
      id: crypto.randomUUID(),
      orgId,
      type: "CAR",
      make: "Dacia",
      model: "Duster",
      year: 2022,
      vin: "UU1HJDAG123456789",
      licensePlate: "B-123-ABC",
      currentOdometerKm: "32500",
      lastOilChangeDate: toDate(subDays(now, 90)),
      lastRevisionDate: toDate(subDays(now, 200)),
      nextRevisionAtKm: "35000",
      nextRevisionDate: toDate(addDays(now, 30)),
      insuranceProvider: "Allianz Tiriac",
      insurancePolicyNumber: "AT-RO-2024-001",
      insuranceStartDate: toDate(subDays(now, 140)),
      insuranceEndDate: toDate(addDays(now, 25)),
      status: "DUE_SOON",
    },
    {
      id: crypto.randomUUID(),
      orgId,
      type: "CAR",
      make: "Volkswagen",
      model: "Passat",
      year: 2021,
      vin: "WVWZZZ3CZME012345",
      licensePlate: "B-456-XYZ",
      currentOdometerKm: "80500",
      lastOilChangeDate: toDate(subDays(now, 200)),
      lastRevisionDate: toDate(subDays(now, 380)),
      nextRevisionAtKm: "78000",
      nextRevisionDate: toDate(subDays(now, 10)),
      insuranceProvider: "Groupama",
      insurancePolicyNumber: "GRP-789-RO",
      insuranceStartDate: toDate(subDays(now, 280)),
      insuranceEndDate: toDate(subDays(now, 12)),
      status: "OVERDUE",
    },
    {
      id: crypto.randomUUID(),
      orgId,
      type: "TRUCK",
      make: "Scania",
      model: "R450",
      year: 2020,
      vin: "YS2R4X20002112345",
      licensePlate: "B-88-SCN",
      currentOdometerKm: "452000",
      lastOilChangeDate: toDate(subDays(now, 45)),
      lastRevisionDate: toDate(subDays(now, 90)),
      nextRevisionAtKm: "470000",
      nextRevisionDate: toDate(addDays(now, 60)),
      insuranceProvider: "Allianz Tiriac",
      insurancePolicyNumber: "AT-TRUCK-2024-014",
      insuranceStartDate: toDate(subDays(now, 180)),
      insuranceEndDate: toDate(addDays(now, 20)),
      hasHeavyTonnageAuthorization: true,
      tachographCheckDate: toDate(subDays(now, 10)),
      copieConformaStartDate: toDate(subDays(now, 45)),
      copieConformaExpiryDate: toDate(addDays(subDays(now, 45), 365)),
      status: "DUE_SOON",
    },
    {
      id: crypto.randomUUID(),
      orgId,
      type: "EQUIPMENT",
      make: "Caterpillar",
      model: "428F",
      year: 2019,
      vin: null,
      licensePlate: "B-99-CAT",
      currentOdometerKm: "1250",
      lastOilChangeDate: toDate(subDays(now, 60)),
      lastRevisionDate: toDate(subDays(now, 200)),
      nextRevisionAtKm: "2000",
      nextRevisionDate: toDate(addDays(now, 120)),
      insuranceProvider: "Generali",
      insurancePolicyNumber: "GEN-UTIL-2024-07",
      insuranceStartDate: toDate(subDays(now, 90)),
      insuranceEndDate: toDate(addDays(now, 90)),
      status: "OK",
    },
    {
      id: crypto.randomUUID(),
      orgId,
      type: "TRAILER",
      make: "Schmitz",
      model: "S.KO",
      year: 2019,
      vin: null,
      licensePlate: "B-55-TRL",
      currentOdometerKm: "0",
      insuranceProvider: "Omniasig",
      insurancePolicyNumber: "TRL-2024-001",
      insuranceStartDate: toDate(subDays(now, 120)),
      insuranceEndDate: toDate(addDays(now, 200)),
      status: "OK",
    },
  ];

  const serviceEventsData: InferModel<typeof serviceEvents, "insert">[] = [
    {
      id: crypto.randomUUID(),
      vehicleId: vehiclesData[0].id!,
      type: "REVISION",
      date: toDate(subDays(now, 30))!,
      odometerKm: "32000",
      nextDueKm: "35000",
      nextDueDate: toDate(addDays(now, 60)),
      notes: "Revizie completa, schimb filtre si verificari electrice.",
      createdBy: mechanicId,
    },
    {
      id: crypto.randomUUID(),
      vehicleId: vehiclesData[1].id!,
      type: "REPAIR",
      date: toDate(subDays(now, 20))!,
      odometerKm: "80000",
      nextDueKm: "84000",
      nextDueDate: toDate(addDays(now, 90)),
      notes: "Inlocuit placute frana si discuri fata.",
      createdBy: mechanicId,
    },
  ];

  const odometerLogsData: InferModel<typeof odometerLogs, "insert">[] = vehiclesData.flatMap((vehicle) => {
    const start = subDays(now, 90);
    return [0, 30, 60, 90].map((offset) => ({
      id: crypto.randomUUID(),
      vehicleId: vehicle.id!,
      date: toDate(addDays(start, offset))!,
      valueKm: (Number(vehicle.currentOdometerKm ?? "0") - (90 - offset) * 40).toString(),
      source: offset === 0 ? "IMPORT" : "MANUAL",
    }));
  });

  const documentsData: InferModel<typeof documents, "insert">[] = vehiclesData.flatMap((vehicle) => {
    const expiresBase = vehicle.insuranceEndDate ? new Date(`${vehicle.insuranceEndDate}T00:00:00Z`) : addMonths(now, 6);
    return [
      {
        id: crypto.randomUUID(),
        vehicleId: vehicle.id!,
        kind: "INSURANCE",
        fileName: `${vehicle.licensePlate}-rca.pdf`,
        fileUrl: `https://public.blob.vercel-storage.com/demo/${vehicle.licensePlate.toLowerCase()}-rca.pdf`,
        uploadedBy: adminId,
        expiresAt: vehicle.insuranceEndDate,
      },
      {
        id: crypto.randomUUID(),
        vehicleId: vehicle.id!,
        kind: "ITP",
        fileName: `${vehicle.licensePlate}-itp.pdf`,
        fileUrl: `https://public.blob.vercel-storage.com/demo/${vehicle.licensePlate.toLowerCase()}-itp.pdf`,
        uploadedBy: adminId,
        expiresAt: toDate(addMonths(expiresBase, 6)),
      },
      {
        id: crypto.randomUUID(),
        vehicleId: vehicle.id!,
        kind: "REGISTRATION",
        fileName: `${vehicle.licensePlate}-talon.pdf`,
        fileUrl: `https://public.blob.vercel-storage.com/demo/${vehicle.licensePlate.toLowerCase()}-talon.pdf`,
        uploadedBy: adminId,
        expiresAt: null,
      },
    ];
  });

  const remindersData: InferModel<typeof reminders, "insert">[] = [
    {
      id: crypto.randomUUID(),
      vehicleId: vehiclesData[0].id!,
      kind: "DATE",
      dueDate: toDate(addDays(now, 5)),
      leadDays: 30,
      status: "PENDING",
      channel: "EMAIL",
    },
    {
      id: crypto.randomUUID(),
      vehicleId: vehiclesData[2].id!,
      kind: "DATE",
      dueDate: toDate(addDays(now, 60)),
      leadDays: 30,
      status: "PENDING",
      channel: "IN_APP",
    },
    {
      id: crypto.randomUUID(),
      vehicleId: vehiclesData[1].id!,
      kind: "ODOMETER",
      dueKm: "80000",
      leadKm: 1000,
      status: "PENDING",
      channel: "EMAIL",
    },
  ];

  const tireStocksData: InferModel<typeof tireStocks, "insert">[] = [
    { id: crypto.randomUUID(), orgId, brand: "Michelin", model: "X Multi Z", dimension: "315/70 R22.5", location: "Depozit A", quantity: 12 },
    { id: crypto.randomUUID(), orgId, brand: "Continental", model: "HDR2", dimension: "385/65 R22.5", location: "Depozit A", quantity: 8 },
    { id: crypto.randomUUID(), orgId, brand: "Goodyear", model: "KMAX S", dimension: "295/80 R22.5", location: "Depozit B", quantity: 6 },
  ];

  const notificationsData: InferModel<typeof notifications, "insert">[] = [
    {
      id: crypto.randomUUID(),
      userId: adminId,
      title: "Revizie camion in curand",
      message: "Camionul Scania R450 are revizie programata in 5 zile.",
      linkUrl: `/vehicule/${vehiclesData[2].id}`,
    },
    {
      id: crypto.randomUUID(),
      userId: ownerId,
      title: "Asigurare expirata",
      message: "Vehiculul Volkswagen Passat are asigurarea expirata.",
      linkUrl: `/vehicule/${vehiclesData[1].id}`,
    },
  ];

  console.info("Inserare date demo...");
  await db.insert(users).values(usersData);
  await db.insert(organizations).values(orgData);
  await db.insert(memberships).values(membershipsData);
  await db.insert(vehicles).values(vehiclesData);
  await db.insert(serviceEvents).values(serviceEventsData);
  await db.insert(odometerLogs).values(odometerLogsData);
  await db.insert(documents).values(documentsData);
  await db.insert(reminders).values(remindersData);
  await db.insert(tireStocks).values(tireStocksData);
  await db.insert(notifications).values(notificationsData);

  console.info("Seed finalizat cu succes.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
