import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../middleware/auth.js";
import { Prescription } from "../models/Prescription.js";
import { Patient } from "../models/Patient.js";
import { Doctor } from "../models/Doctor.js";

const router = Router();
router.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: "Too many verification attempts. Please try again later.",
    },
  }),
);
router.get(
  "/:code",
  (req, res, next) => {
    if (req.headers.authorization) return requireAuth(req, res, next);
    next();
  },
  async (req, res, next) => {
    try {
      const code = String(req.params.code).trim().toUpperCase();
      if (!/^RX-MZ-\d{4}-(?:[A-F0-9]{6}|[A-F0-9]{32})$/.test(code)) {
        return res
          .status(400)
          .json({ valid: false, message: "Enter a valid prescription code." });
      }
      const prescription = await Prescription.findOne({
        prescriptionCode: code,
      });
      if (!prescription)
        return res
          .status(404)
          .json({ valid: false, message: "Prescription not found." });
      const expired = prescription.expiresAt
        ? prescription.expiresAt.getTime() < Date.now()
        : false;
      let detailsAvailable =
        req.user?.role === "pharmacy" || req.user?.role === "admin";
      if (req.user?.role === "patient") {
        detailsAvailable = !!(await Patient.exists({
          _id: prescription.patientId,
          userId: req.user.id,
        }));
      } else if (req.user?.role === "doctor") {
        detailsAvailable = !!(await Doctor.exists({
          _id: prescription.doctorId,
          userId: req.user.id,
        }));
      }
      const summary = {
        prescriptionCode: prescription.prescriptionCode,
        status: expired ? "expired" : prescription.status,
        issuedAt: prescription.issuedAt,
        expiresAt: prescription.expiresAt,
      };
      if (!detailsAvailable)
        return res.json({
          valid: prescription.status === "valid" && !expired,
          detailsAvailable: false,
          prescription: { ...summary, medicines: [] },
        });
      await prescription.populate({
        path: "doctorId",
        populate: { path: "userId", select: "name" },
      });
      const doctor = prescription.doctorId as unknown as {
        userId?: { name?: string };
      };
      return res.json({
        valid: prescription.status === "valid" && !expired,
        detailsAvailable: true,
        prescription: {
          ...summary,
          doctor: doctor.userId?.name || "Unknown doctor",
          medicines: prescription.medicines,
          instructions: prescription.instructions,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);
export default router;
