import { Router } from "express";
import { z } from "zod";
import { syncByConversationId, syncByPropertyName, syncByReservationId } from "../lib/sync";

const propertySchema = z.object({
  propertyName: z.string().min(1, "propertyName is required")
});

export const syncRouter = Router();

syncRouter.post("/property", async (req, res) => {
  const parsed = propertySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.issues[0]?.message ?? "Invalid request body"
    });
  }

  try {
    const summary = await syncByPropertyName(parsed.data.propertyName);
    return res.json({ ok: true, summary });
  } catch (error) {
    return res.status(500).json({ ok: false, error: (error as Error).message });
  }
});

syncRouter.post("/reservation/:reservationId", async (req, res) => {
  try {
    const summary = await syncByReservationId(req.params.reservationId);
    return res.json({ ok: true, summary });
  } catch (error) {
    return res.status(500).json({ ok: false, error: (error as Error).message });
  }
});

syncRouter.post("/conversation/:conversationId", async (req, res) => {
  try {
    const summary = await syncByConversationId(req.params.conversationId);
    return res.json({ ok: true, summary });
  } catch (error) {
    return res.status(500).json({ ok: false, error: (error as Error).message });
  }
});
