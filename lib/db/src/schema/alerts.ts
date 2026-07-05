import { pgTable, serial, text, varchar, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const alertsTable = pgTable("alerts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().default("anonymous"),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  indicator: varchar("indicator", { length: 50 }).notNull(), // e.g. "price", "rsi", "sma_20", "volume"
  operator: varchar("operator", { length: 10 }).notNull(), // ">", "<", "==", ">=", "<="
  targetValue: numeric("target_value").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"), // "active", "triggered", "paused"
  triggeredAt: timestamp("triggered_at"),
  createdAt: timestamp("created_at").defaultNow(),
  message: text("message"),
  isGlobal: boolean("is_global").default(false), // apply to entire watchlist
  watchlistId: text("watchlist_id"),
});

export const insertAlertSchema = createInsertSchema(alertsTable).omit({ id: true, createdAt: true, triggeredAt: true });
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alertsTable.$inferSelect;
