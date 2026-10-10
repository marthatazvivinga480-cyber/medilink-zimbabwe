import { requestContext } from "./middleware/requestContext.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";

import authRoutes from "./routes/auth.js";
import doctorRoutes from "./routes/doctors.js";
import appointmentRoutes from "./routes/appointments.js";
import patientRoutes from "./routes/patients.js";
import medicalRecordRoutes from "./routes/medicalRecords.js";
import prescriptionRoutes from "./routes/prescriptions.js";
import consultationRoutes from "./routes/consultations.js";
import verificationRoutes from "./routes/verification.js";
import notificationRoutes from "./routes/notifications.js";
import paymentRoutes from "./routes/payments.js";
import adminRoutes from "./routes/admin.js";

import {
  notFound,
  errorHandler,
} from "./middleware/error.js";

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use("/api", requestContext);

app.use(
  cors({
    origin: env.clientOrigin,
  })
);

app.use(
  express.json({
    limit: "1mb",
  })
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
});

app.use("/api/auth", authLimiter);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "medilink-zimbabwe-api",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/patients", patientRoutes);

app.use(
  "/api/medical-records",
  medicalRecordRoutes
);

app.use(
  "/api/prescriptions",
  prescriptionRoutes
);

app.use(
  "/api/consultations",
  consultationRoutes
);

app.use(
  "/api/verification",
  verificationRoutes
);

app.use(
  "/api/notifications",
  notificationRoutes
);

app.use(
  "/api/payments",
  paymentRoutes
);

app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;