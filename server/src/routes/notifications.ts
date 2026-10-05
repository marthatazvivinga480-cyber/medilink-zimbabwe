import { Router } from "express";

import { requireAuth } from "../middleware/auth.js";
import { Notification } from "../models/Notification.js";

const router = Router();

/**
 * GET /api/notifications
 *
 * Returns the signed-in user's notifications,
 * newest first.
 */
router.get(
  "/",
  requireAuth,
  async (req, res, next) => {
    try {
      const notifications =
        await Notification.find({
          userId: req.user!.id,
        })
          .sort({
            createdAt: -1,
          })
          .limit(50);

      const unreadCount =
        await Notification.countDocuments({
          userId: req.user!.id,
          isRead: false,
        });

      return res.json({
        notifications,
        unreadCount,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/notifications/unread-count
 *
 * Returns only the unread notification count.
 * Useful for the notification bell badge.
 */
router.get(
  "/unread-count",
  requireAuth,
  async (req, res, next) => {
    try {
      const unreadCount =
        await Notification.countDocuments({
          userId: req.user!.id,
          isRead: false,
        });

      return res.json({
        unreadCount,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/notifications/read-all
 *
 * Marks all notifications belonging to the
 * signed-in user as read.
 */
router.patch(
  "/read-all",
  requireAuth,
  async (req, res, next) => {
    try {
      const result =
        await Notification.updateMany(
          {
            userId: req.user!.id,
            isRead: false,
          },
          {
            $set: {
              isRead: true,
            },
          }
        );

      return res.json({
        message:
          "All notifications marked as read.",
        modifiedCount:
          result.modifiedCount,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/notifications/:id/read
 *
 * Marks one notification as read.
 */
router.patch(
  "/:id/read",
  requireAuth,
  async (req, res, next) => {
    try {
      const notification =
        await Notification.findOneAndUpdate(
          {
            _id: req.params.id,
            userId: req.user!.id,
          },
          {
            $set: {
              isRead: true,
            },
          },
          {
            new: true,
          }
        );

      if (!notification) {
        return res.status(404).json({
          message:
            "Notification not found.",
        });
      }

      return res.json({
        message:
          "Notification marked as read.",
        notification,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;