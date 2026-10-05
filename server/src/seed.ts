import bcrypt from "bcryptjs";
import { connectDatabase } from "./config/db.js";
import { User } from "./models/User.js";
import { Patient } from "./models/Patient.js";
import { Doctor } from "./models/Doctor.js";
import { DoctorAvailability } from "./models/DoctorAvailability.js";
import { Appointment } from "./models/Appointment.js";
import { MedicalRecord } from "./models/MedicalRecord.js";
import { Prescription } from "./models/Prescription.js";
import mongoose from "mongoose";

async function seed() {
  await connectDatabase();

  await Promise.all([
    User.deleteMany({}),
    Patient.deleteMany({}),
    Doctor.deleteMany({}),
    DoctorAvailability.deleteMany({}),
    Appointment.deleteMany({}),
    MedicalRecord.deleteMany({}),
    Prescription.deleteMany({})
  ]);

  const patientUser = await User.create({
    name: "Martha T.",
    email: "patient@medilink.co.zw",
    passwordHash: await bcrypt.hash("Patient123!", 12),
    role: "patient",
    phone: "+263 77 000 0000"
  });
  const patient = await Patient.create({
    userId: patientUser._id,
    dateOfBirth: new Date("1998-04-15"),
    emergencyContact: { name: "Emergency Contact", phone: "+263 77 111 1111", relationship: "Sibling" },
    bloodGroup: "O+",
    allergies: ["Penicillin"],
    existingConditions: []
  });

  const doctorUser = await User.create({
    name: "Dr. Tendai Moyo",
    email: "doctor@medilink.co.zw",
    passwordHash: await bcrypt.hash("Doctor123!", 12),
    role: "doctor",
    phone: "+263 77 222 2222"
  });
  const doctor = await Doctor.create({
    userId: doctorUser._id,
    speciality: "General Practice",
    qualifications: ["MBChB", "Primary Care"],
    biography: "Primary care physician focused on accessible, continuous care.",
    location: "Harare, Zimbabwe",
    registrationInfo: "Demo registration"
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = tomorrow.toISOString().slice(0, 10);
  await DoctorAvailability.create({
    doctorId: doctor._id,
    date,
    slots: [
      { startTime: "09:00", endTime: "09:30", isBooked: false },
      { startTime: "10:00", endTime: "10:30", isBooked: false },
      { startTime: "11:00", endTime: "11:30", isBooked: false },
      { startTime: "14:00", endTime: "14:30", isBooked: false }
    ]
  });

  const appointment = await Appointment.create({
    patientId: patient._id,
    doctorId: doctor._id,
    date,
    startTime: "09:00",
    endTime: "09:30",
    reason: "Routine consultation",
    status: "completed"
  });

  await MedicalRecord.create({
    patientId: patient._id,
    doctorId: doctor._id,
    appointmentId: appointment._id,
    diagnosis: "Hypertension",
    diagnosisExplanation: "High blood pressure. This means the pressure of blood flowing through your arteries is consistently higher than normal.",
    symptoms: "Occasional headaches",
    observations: "Blood pressure requires ongoing monitoring.",
    treatment: "Lifestyle measures and prescribed medication.",
    followUp: "Review blood pressure in 4 weeks."
  });

  const prescription = await Prescription.create({
    patientId: patient._id,
    doctorId: doctor._id,
    appointmentId: appointment._id,
    prescriptionCode: "RX-MZ-2026-009812",
    medicines: [{ name: "Amoxicillin", dosage: "500 mg", frequency: "3 times daily", duration: "5 days" }],
    instructions: "Take exactly as directed by the prescribing clinician.",
    issuedAt: new Date(),
    status: "valid"
  });

  console.log("\nSeed complete.");
  console.log("Patient: patient@medilink.co.zw / Patient123!");
  console.log("Doctor: doctor@medilink.co.zw / Doctor123!");
  console.log(`Prescription verification code: ${prescription.prescriptionCode}\n`);

  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
