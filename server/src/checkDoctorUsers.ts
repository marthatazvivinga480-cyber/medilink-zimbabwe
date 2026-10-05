import mongoose from "mongoose";

import { connectDatabase } from "./config/db.js";
import { User } from "./models/User.js";

async function checkDoctorUsers() {
  await connectDatabase();

  const doctors = await User.find({
    role: "doctor",
  }).select("name email role");

  console.log("Doctor accounts:");

  doctors.forEach((doctor) => {
    console.log({
      id: doctor._id.toString(),
      name: doctor.name,
      email: doctor.email,
      role: doctor.role,
    });
  });

  await mongoose.disconnect();
}

checkDoctorUsers().catch(async (error) => {
  console.error("Failed to check doctor accounts:", error);

  await mongoose.disconnect();
  process.exit(1);
});