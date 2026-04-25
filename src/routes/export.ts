import { Router } from "express";
import { stringify } from "csv-stringify/sync";
import { pool } from "../db/client.js";

export const exportRouter = Router();

exportRouter.get("/properties.csv", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT listing_map_id, name, external_listing_id, updated_at, raw_data
       FROM properties ORDER BY name ASC`,
    );

    const csv = stringify(rows, { header: true });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="properties.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

exportRouter.get("/reservations.csv", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT reservation_id, listing_map_id, property_name, conversation_id,
              status, guest_name, arrival_date, departure_date, updated_at, raw_data
       FROM reservations ORDER BY reservation_id DESC`,
    );

    const csv = stringify(rows, { header: true });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="reservations.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

exportRouter.get("/conversations.csv", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT conversation_id, listing_map_id, property_name, reservation_id,
              subject, channel, updated_at, raw_data
       FROM conversations ORDER BY conversation_id DESC`,
    );

    const csv = stringify(rows, { header: true });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="conversations.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

exportRouter.get("/messages.csv", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT message_id, conversation_id, sent_at, sender_type, body, updated_at, raw_data
       FROM conversation_messages ORDER BY message_id DESC`,
    );

    const csv = stringify(rows, { header: true });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="messages.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
});
