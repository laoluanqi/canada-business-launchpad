import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const businessWorkspaces = sqliteTable("business_workspaces", {
  ownerHash: text("owner_hash").primaryKey(),
  id: text("id").notNull().unique(),
  revision: integer("revision").notNull(),
  payload: text("payload").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const launchJourneys = sqliteTable("launch_journeys", {
  ownerHash: text("owner_hash").primaryKey(),
  id: text("id").notNull().unique(),
  revision: integer("revision").notNull(),
  payload: text("payload").notNull(),
  updatedAt: text("updated_at").notNull(),
});
