import mongoose from "mongoose";

import { connectDatabase } from "./config/db.js";
import { User } from "./models/User.js";
import { Doctor } from "./models/Doctor.js";
import { DoctorAvailability } from "./models/DoctorAvailability.js";
import { Appointment } from "./models/Appointment.js";
import { MedicalRecord } from "./models/MedicalRecord.js";
import { Prescription } from "./models/Prescription.js";

async function mergeDuplicateTendai() {
  await connectDatabase();

  const canonicalUser = await User.findOne({
    email: "doctor@medilink.co.zw",
  });

  const duplicateUser = await User.findOne({
    email: "tendai.moyo@medilink.demo",
  });

  if (!canonicalUser) {
    throw new Error(
      "Original Tendai user was not found."
    );
  }

  if (!duplicateUser) {
    console.log(
      "Duplicate Tendai user was not found. Nothing to merge."
    );

    await mongoose.disconnect();
    return;
  }

  const canonicalDoctor = await Doctor.findOne({
    userId: canonicalUser._id,
  });

  const duplicateDoctor = await Doctor.findOne({
    userId: duplicateUser._id,
  });

  if (!canonicalDoctor) {
    throw new Error(
      "Original Tendai doctor profile was not found."
    );
  }

  if (!duplicateDoctor) {
    throw new Error(
      "Duplicate Tendai doctor profile was not found."
    );
  }

  console.log("Merging duplicate Tendai profiles...");

  canonicalDoctor.speciality =
    duplicateDoctor.speciality ||
    canonicalDoctor.speciality;

  canonicalDoctor.qualifications =
    duplicateDoctor.qualifications?.length
      ? duplicateDoctor.qualifications
      : canonicalDoctor.qualifications;

  canonicalDoctor.biography =
    duplicateDoctor.biography ||
    canonicalDoctor.biography;

  canonicalDoctor.location =
    duplicateDoctor.location ||
    canonicalDoctor.location;

  canonicalDoctor.registrationInfo =
    duplicateDoctor.registrationInfo ||
    canonicalDoctor.registrationInfo;

  canonicalDoctor.photoUrl =
    duplicateDoctor.photoUrl ||
    canonicalDoctor.photoUrl;

  canonicalDoctor.facility =
    duplicateDoctor.facility ||
    canonicalDoctor.facility;

  canonicalDoctor.languages =
    duplicateDoctor.languages?.length
      ? duplicateDoctor.languages
      : canonicalDoctor.languages;

  canonicalDoctor.yearsOfExperience =
    duplicateDoctor.yearsOfExperience ??
    canonicalDoctor.yearsOfExperience;

  canonicalDoctor.areasOfCare =
    duplicateDoctor.areasOfCare?.length
      ? duplicateDoctor.areasOfCare
      : canonicalDoctor.areasOfCare;

  canonicalDoctor.consultationTypes =
    duplicateDoctor.consultationTypes?.length
      ? duplicateDoctor.consultationTypes
      : canonicalDoctor.consultationTypes;

  canonicalDoctor.isVerified =
    duplicateDoctor.isVerified ||
    canonicalDoctor.isVerified;

  await canonicalDoctor.save();

  canonicalUser.name =
    duplicateUser.name || canonicalUser.name;

  canonicalUser.phone =
    duplicateUser.phone || canonicalUser.phone;

  await canonicalUser.save();

  const canonicalId =
    canonicalDoctor._id;

  const duplicateId =
    duplicateDoctor._id;

  await Appointment.updateMany(
    {
      doctorId: duplicateId,
    },
    {
      $set: {
        doctorId: canonicalId,
      },
    }
  );

  await MedicalRecord.updateMany(
    {
      doctorId: duplicateId,
    },
    {
      $set: {
        doctorId: canonicalId,
      },
    }
  );

  await Prescription.updateMany(
    {
      doctorId: duplicateId,
    },
    {
      $set: {
        doctorId: canonicalId,
      },
    }
  );

  const duplicateAvailability =
    await DoctorAvailability.find({
      doctorId: duplicateId,
    });

  for (const availability of duplicateAvailability) {
    const existing =
      await DoctorAvailability.findOne({
        doctorId: canonicalId,
        date: availability.date,
      });

    if (!existing) {
      availability.doctorId =
        canonicalId;

      await availability.save();

      continue;
    }

    const existingSlotKeys =
      new Set(
        existing.slots.map(
          (slot: any) =>
            `${slot.startTime}-${slot.endTime}`
        )
      );

    for (const slot of availability.slots) {
      const key =
        `${slot.startTime}-${slot.endTime}`;

      if (!existingSlotKeys.has(key)) {
        existing.slots.push(slot);
      }
    }

    await existing.save();

    await DoctorAvailability.deleteOne({
      _id: availability._id,
    });
  }

  await Doctor.deleteOne({
    _id: duplicateId,
  });

  await User.deleteOne({
    _id: duplicateUser._id,
  });

  console.log(
    "Duplicate Tendai profile merged successfully."
  );

  console.log(
    `Kept doctor profile: ${canonicalDoctor._id}`
  );

  console.log(
    `Kept user account: ${canonicalUser.email}`
  );

  await mongoose.disconnect();
}

mergeDuplicateTendai().catch(
  async (error) => {
    console.error(error);

    await mongoose.disconnect();

    process.exit(1);
  }
);