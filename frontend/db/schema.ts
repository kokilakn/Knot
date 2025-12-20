import { pgTable, text, timestamp, uuid, primaryKey, index } from "drizzle-orm/pg-core";


// Custom type for pgvector
// Note: Drizzle doesn't have native vector support in pg-core yet, 
// so we define it as a custom type if needed, or use text/custom.
// For now, we'll use a custom type mapping for the 'vector' extension.


export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    oauthId: text("oauth_id").unique(),
    password: text("password"),
    avatarUrl: text("avatar_url"),
    selfieUrl: text("selfie_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
    return [
        index("idx_users_email").on(table.email),
        index("idx_users_oauth_id").on(table.oauthId),
    ];
});

export const events = pgTable("events", {
    eventId: uuid("event_id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(), // 10-character alphanumeric code for sharing
    name: text("name").notNull(),
    eventDate: timestamp("event_date", { withTimezone: true }).notNull(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    notes: text("notes"),
    coverPageUrl: text("cover_page_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
    return [
        index("idx_events_user_id").on(table.userId),
        index("idx_events_event_date").on(table.eventDate),
        index("idx_events_code").on(table.code),
    ];
});

export const eventParticipants = pgTable("event_participants", {
    eventId: uuid("event_id").notNull().references(() => events.eventId, { onDelete: 'cascade' }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
    return [
        primaryKey({ columns: [table.eventId, table.userId] }),
        index("idx_event_participants_user_id").on(table.userId),
        index("idx_event_participants_event_id").on(table.eventId),
    ];
});

export const photos = pgTable("photos", {
    id: uuid("id").primaryKey().defaultRandom(),
    link: text("link").notNull(),
    // Vector support in Drizzle is typically handled via custom types or raw sql for now
    // Since we are pushing to a local DB that has the extension, we can define it carefully
    vector: text("vector"), // Placeholder for storage, will need cast or custom type for actual vector ops
    eventId: uuid("event_id").notNull().references(() => events.eventId, { onDelete: 'cascade' }),
    uploaderId: uuid("uploader_id").references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
    return [
        index("idx_photos_event_id").on(table.eventId),
        index("idx_photos_uploader_id").on(table.uploaderId),
    ];
});
