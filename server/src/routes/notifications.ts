import { Router } from "express";
import { Notification } from "../models/Notification.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user!.id }).sort({ createdAt: -1 }).limit(50);
    res.json({ notifications });
  } catch (err) { next(err); }
});

export default router;
