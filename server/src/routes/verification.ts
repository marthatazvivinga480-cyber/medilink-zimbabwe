import { Router } from "express";
import { Prescription } from "../models/Prescription.js";

const router = Router();

router.get("/:code", async (req, res, next) => {
  try {
    const prescription = await Prescription.findOne({ prescriptionCode: req.params.code })
      .populate({ path: "doctorId", populate: { path: "userId", select: "name" } });

    if (!prescription) return res.status(404).json({ valid: false, message: "Prescription not found." });

    const expired = prescription.expiresAt ? new Date(prescription.expiresAt).getTime() < Date.now() : false;
    const valid = prescription.status === "valid" && !expired;

    res.json({
      valid,
      prescription: {
        prescriptionCode: prescription.prescriptionCode,
        doctor: (prescription.doctorId as any)?.userId?.name || "Unknown doctor",
        medicines: prescription.medicines,
        instructions: prescription.instructions,
        issuedAt: prescription.issuedAt,
        expiresAt: prescription.expiresAt,
        status: expired ? "expired" : prescription.status
      }
    });
  } catch (err) { next(err); }
});

export default router;
