import { Router } from "express";
import { stringify } from "csv-stringify/sync";
import { queryRows } from "../lib/repository";

export const exportRouter = Router();

function sendCsv(res: any, filename: string, records: any[]): void {
  const csv = stringify(records, { header: true });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
  res.status(200).send(csv);
}

exportRouter.get("/properties.csv", async (_req, res) => {
  try {
    const rows = await queryRows(`
      SELECT listing_id, name, city, country, status, updated_at
      FROM properties
      ORDER BY listing_id
    `);
    sendCsv(res, "properties.csv", rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

exportRouter.get("/reservations.csv", async (_req, res) => {
  try {
    const rows = await queryRows(`
      SELECT reservation_id, listing_id, guest_name, status, check_in, check_out, updated_at
      FROM reservations
      ORDER BY reservation_id
    `);
    sendCsv(res, "reservations.csv", rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

exportRouter.get("/conversations.csv", async (_req, res) => {
  try {
    const rows = await queryRows(`
      SELECT conversation_id, reservation_id, listing_id, guest_name, status, last_message_at, updated_at
      FROM conversations
      ORDER BY conversation_id
    `);
    sendCsv(res, "conversations.csv", rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

exportRouter.get("/messages.csv", async (_req, res) => {
  try {
    const rows = await queryRows(`
      SELECT message_id, conversation_id, sender_type, body, sent_at, updated_at
      FROM conversation_messages
      ORDER BY message_id
    `);
    sendCsv(res, "messages.csv", rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});
