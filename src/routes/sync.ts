import { Router } from "express";
import { syncByPropertyName, syncConversation, syncReservation } from "../lib/sync.js";

export const syncRouter = Router();

syncRouter.post("/property", async (req, res, next) => {
  try {
    const propertyName = String(req.body?.propertyName ?? "").trim();
    if (!propertyName) {
      return res.status(400).json({ error: "propertyName is required" });
    }

    const summary = await syncByPropertyName(propertyName);
    return res.json({ ok: true, propertyName, summary });
  } catch (error) {
    return next(error);
  }
});

syncRouter.post("/reservation/:reservationId", async (req, res, next) => {
  try {
    const reservationId = Number(req.params.reservationId);
    if (!Number.isFinite(reservationId)) {
      return res.status(400).json({ error: "Invalid reservationId" });
    }

    await syncReservation(reservationId);
    return res.json({ ok: true, reservationId });
  } catch (error) {
    return next(error);
  }
});

syncRouter.post("/conversation/:conversationId", async (req, res, next) => {
  try {
    const conversationId = Number(req.params.conversationId);
    if (!Number.isFinite(conversationId)) {
      return res.status(400).json({ error: "Invalid conversationId" });
    }

    await syncConversation(conversationId);
    return res.json({ ok: true, conversationId });
  } catch (error) {
    return next(error);
  }
});
