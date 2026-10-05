import mongoose from "mongoose";

const medicalRecordSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
  diagnosis: { type: String, required: true },
  diagnosisExplanation: String,
  symptoms: String,
  observations: String,
  treatment: String,
  followUp: String
}, { timestamps: true });

export const MedicalRecord = mongoose.model("MedicalRecord", medicalRecordSchema);
