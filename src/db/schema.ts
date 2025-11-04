import { relations, sql } from 'drizzle-orm';
import {
  pgEnum,
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  numeric,
  date,
  boolean,
  uniqueIndex,
  index,
  check,
  primaryKey,
} from 'drizzle-orm/pg-core';

export const membershipRoleEnum = pgEnum('membership_role', ['OWNER', 'ADMIN', 'MECHANIC', 'VIEWER']);

export const vehicleTypeEnum = pgEnum('vehicle_type', ['CAR', 'TRUCK']);
export const vehicleStatusEnum = pgEnum('vehicle_status', ['OK', 'DUE_SOON', 'OVERDUE']);

export const serviceEventTypeEnum = pgEnum('service_event_type', [
  'OIL_CHANGE',
  'REVISION',
  'REPAIR',
  'INSPECTION',
  'OTHER',
]);

export const odometerSourceEnum = pgEnum('odometer_source', ['MANUAL', 'IMPORT']);

export const documentKindEnum = pgEnum('document_kind', [
  'INSURANCE',
  'ITP',
  'REGISTRATION',
  'PHOTO',
  'OTHER',
]);

export const reminderKindEnum = pgEnum('reminder_kind', ['DATE', 'ODOMETER']);
export const reminderStatusEnum = pgEnum('reminder_status', ['PENDING', 'SENT', 'DISMISSED']);
export const reminderChannelEnum = pgEnum('reminder_channel', ['EMAIL', 'IN_APP']);

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name'),
    email: text('email').notNull().unique(),
    image: text('image'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
  }),
);

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: membershipRoleEnum('role').notNull().default('VIEWER'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    membershipUniqueIdx: uniqueIndex('memberships_org_user_unique').on(table.orgId, table.userId),
  }),
);

export const vehicles = pgTable(
  'vehicles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    type: vehicleTypeEnum('type').notNull(),
    make: text('make').notNull(),
    model: text('model').notNull(),
    year: integer('year').notNull(),
    vin: text('vin'),
    licensePlate: text('license_plate').notNull(),
    currentOdometerKm: numeric('current_odometer_km', { precision: 12, scale: 2 })
      .default('0')
      .notNull(),
    lastOilChangeDate: date('last_oil_change_date'),
    lastRevisionDate: date('last_revision_date'),
    nextRevisionAtKm: numeric('next_revision_at_km', { precision: 12, scale: 2 }),
    nextRevisionDate: date('next_revision_date'),
    insuranceProvider: text('insurance_provider'),
    insurancePolicyNumber: text('insurance_policy_number'),
    insuranceEndDate: date('insurance_end_date'),
    hasHeavyTonnageAuthorization: boolean('has_heavy_tonnage_authorization'),
    tachographCheckDate: date('tachograph_check_date'),
    status: vehicleStatusEnum('status').notNull().default('OK'),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    licensePlateOrgUnique: uniqueIndex('vehicles_org_license_plate_unique').on(
      table.orgId,
      table.licensePlate,
    ),
    vinUnique: uniqueIndex('vehicles_vin_unique').on(table.vin).where(sql`${table.vin} IS NOT NULL`),
    trucksAuthorizationIdx: index('vehicles_truck_authorization_idx')
      .on(table.type, table.hasHeavyTonnageAuthorization)
      .where(sql`${table.type} = 'TRUCK'`),
    trucksTachographIdx: index('vehicles_truck_tachograph_idx')
      .on(table.type, table.tachographCheckDate)
      .where(sql`${table.type} = 'TRUCK'`),
    insuranceEndDateIdx: index('vehicles_insurance_end_date_idx').on(table.insuranceEndDate),
    truckAuthorizationCheck: check(
      'vehicles_truck_authorization_check',
      sql`${table.type} = 'TRUCK' OR ${table.hasHeavyTonnageAuthorization} IS NULL`,
    ),
    truckTachographCheck: check(
      'vehicles_truck_tachograph_check',
      sql`${table.type} = 'TRUCK' OR ${table.tachographCheckDate} IS NULL`,
    ),
  }),
);

export const serviceEvents = pgTable(
  'service_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    vehicleId: uuid('vehicle_id')
      .notNull()
      .references(() => vehicles.id, { onDelete: 'cascade' }),
    type: serviceEventTypeEnum('type').notNull(),
    date: date('date').notNull(),
    odometerKm: numeric('odometer_km', { precision: 12, scale: 2 }),
    nextDueKm: numeric('next_due_km', { precision: 12, scale: 2 }),
    nextDueDate: date('next_due_date'),
    notes: text('notes'),
    costCurrency: text('cost_currency').default('RON'),
    costAmount: numeric('cost_amount', { precision: 10, scale: 2 }),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    vehicleDateIdx: index('service_events_vehicle_date_idx').on(table.vehicleId, table.date),
  }),
);

export const odometerLogs = pgTable(
  'odometer_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    vehicleId: uuid('vehicle_id')
      .notNull()
      .references(() => vehicles.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    valueKm: numeric('value_km', { precision: 12, scale: 2 }).notNull(),
    source: odometerSourceEnum('source').notNull().default('MANUAL'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    vehicleDateIdx: index('odometer_logs_vehicle_date_idx').on(table.vehicleId, table.date),
  }),
);

export const documents = pgTable(
  'documents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    vehicleId: uuid('vehicle_id')
      .notNull()
      .references(() => vehicles.id, { onDelete: 'cascade' }),
    kind: documentKindEnum('kind').notNull(),
    fileUrl: text('file_url').notNull(),
    fileName: text('file_name').notNull(),
    uploadedBy: uuid('uploaded_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: date('expires_at'),
  },
  (table) => ({
    vehicleKindIdx: index('documents_vehicle_kind_idx').on(table.vehicleId, table.kind),
  }),
);

export const reminders = pgTable(
  'reminders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    vehicleId: uuid('vehicle_id')
      .notNull()
      .references(() => vehicles.id, { onDelete: 'cascade' }),
    serviceEventId: uuid('service_event_id').references(() => serviceEvents.id, {
      onDelete: 'set null',
    }),
    kind: reminderKindEnum('kind').notNull(),
    dueDate: date('due_date'),
    dueKm: numeric('due_km', { precision: 12, scale: 2 }),
    leadKm: integer('lead_km').default(1000).notNull(),
    leadDays: integer('lead_days').default(30).notNull(),
    status: reminderStatusEnum('status').default('PENDING').notNull(),
    channel: reminderChannelEnum('channel').default('EMAIL').notNull(),
    lastNotifiedAt: timestamp('last_notified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    dueDateIdx: index('reminders_due_date_idx').on(table.dueDate),
    dueKmIdx: index('reminders_due_km_idx').on(table.dueKm),
  }),
);

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  message: text('message').notNull(),
  linkUrl: text('link_url'),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    expiresAt: integer('expires_at'),
    tokenType: text('token_type'),
    scope: text('scope'),
    idToken: text('id_token'),
    sessionState: text('session_state'),
  },
  (table) => ({
    compoundPk: primaryKey({
      name: 'accounts_provider_provider_account_id_pk',
      columns: [table.provider, table.providerAccountId],
    }),
    userIdx: index('accounts_user_id_idx').on(table.userId),
  }),
);

export const sessions = pgTable(
  'sessions',
  {
    sessionToken: text('session_token').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  (table) => ({
    userIdx: index('sessions_user_id_idx').on(table.userId),
  }),
);

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  (table) => ({
    compositePk: primaryKey({ columns: [table.identifier, table.token] }),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
  serviceEvents: many(serviceEvents),
  documents: many(documents),
  notifications: many(notifications),
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(memberships),
  vehicles: many(vehicles),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [memberships.orgId],
    references: [organizations.id],
  }),
}));

export const vehiclesRelations = relations(vehicles, ({ many, one }) => ({
  organization: one(organizations, {
    fields: [vehicles.orgId],
    references: [organizations.id],
  }),
  serviceEvents: many(serviceEvents),
  odometerLogs: many(odometerLogs),
  documents: many(documents),
  reminders: many(reminders),
}));

export const serviceEventsRelations = relations(serviceEvents, ({ one, many }) => ({
  vehicle: one(vehicles, {
    fields: [serviceEvents.vehicleId],
    references: [vehicles.id],
  }),
  author: one(users, {
    fields: [serviceEvents.createdBy],
    references: [users.id],
  }),
  reminders: many(reminders),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [reminders.vehicleId],
    references: [vehicles.id],
  }),
  serviceEvent: one(serviceEvents, {
    fields: [reminders.serviceEventId],
    references: [serviceEvents.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [documents.vehicleId],
    references: [vehicles.id],
  }),
  uploader: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const tireStocks = pgTable(
  'tire_stocks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    size: text('size').notNull(),
    brand: text('brand'),
    notes: text('notes'),
    quantity: integer('quantity').notNull().default(0),
    minQuantity: integer('min_quantity'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    orgSizeUnique: uniqueIndex('tire_stocks_org_id_size_unique').on(table.orgId, table.size),
    orgIdx: index('tire_stocks_org_id_idx').on(table.orgId),
    quantityCheck: check('tire_stocks_quantity_non_negative', sql`${table.quantity} >= 0`),
  }),
);

export const tireStockMovements = pgTable(
  'tire_stock_movements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    stockId: uuid('stock_id')
      .notNull()
      .references(() => tireStocks.id, { onDelete: 'cascade' }),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'set null' }),
    change: integer('change').notNull(),
    reason: text('reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    stockIdx: index('tire_stock_movements_stock_id_idx').on(table.stockId),
    orgIdx: index('tire_stock_movements_org_id_idx').on(table.orgId),
    vehicleIdx: index('tire_stock_movements_vehicle_id_idx').on(table.vehicleId),
  }),
);

export const tireStocksRelations = relations(tireStocks, ({ many, one }) => ({
  organization: one(organizations, {
    fields: [tireStocks.orgId],
    references: [organizations.id],
  }),
  movements: many(tireStockMovements),
}));

export const tireStockMovementsRelations = relations(tireStockMovements, ({ one }) => ({
  stock: one(tireStocks, {
    fields: [tireStockMovements.stockId],
    references: [tireStocks.id],
  }),
  organization: one(organizations, {
    fields: [tireStockMovements.orgId],
    references: [organizations.id],
  }),
  vehicle: one(vehicles, {
    fields: [tireStockMovements.vehicleId],
    references: [vehicles.id],
  }),
}));

export type VehicleStatus = (typeof vehicleStatusEnum.enumValues)[number];
export type VehicleType = (typeof vehicleTypeEnum.enumValues)[number];
export type MembershipRole = (typeof membershipRoleEnum.enumValues)[number];
