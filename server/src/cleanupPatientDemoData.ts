import mongoose from "mongoose";

import { connectDatabase } from "./config/db.js";
import { MedicalRecord } from "./models/MedicalRecord.js";
import { Prescription } from "./models/Prescription.js";

async function cleanupPatientDemoData() {
  await connectDatabase();

  console.log("\nCleaning patient display data...");

  const record =
    await MedicalRecord.findOne({
      diagnosis: "Tension-type headache",
    });

  if (record) {
    record.diagnosis =
      "Tension-type headache";

    record.diagnosisExplanation =
      "A common type of headache that can be linked to stress, tiredness or muscle tension.";

    record.symptoms =
      "Mild to moderate headache with pressure around the forehead and temples.";

    record.observations =
      "Patient stable during consultation.";

    record.treatment =
      "Supportive care discussed with the patient.";

    record.followUp =
      "Return for review if symptoms continue or become worse.";

    await record.save();

    console.log(
      "✓ Medical record updated"
    );
  } else {
    console.log(
      "Medical record was not found."
    );
  }

  const prescription =
    await Prescription.findOneAndUpdate(
      {
        prescriptionCode:
          "RX-MZ-2026-EA75CD",
      },
      {
        $set: {
          medicines: [
            {
              name: "Medication",
              dosage:
                "Clinician-directed dose",
              frequency: "As directed",
              duration: "Short course",
            },
          ],

          instructions:
            "Use according to the prescribing clinician's directions.",
        },
      },
      {
        new: true,
      }
    );

  if (prescription) {
    console.log(
      "✓ Prescription updated"
    );
  } else {
    console.log(
      "Prescription was not found."
    );
  }

  console.log(
    "\nPatient display data cleanup complete.\n"
  );

  await mongoose.disconnect();
}

cleanupPatientDemoData().catch(
  async (error) => {
    console.error(
      "Patient data cleanup failed:",
      error
    );

    await mongoose.disconnect();

    process.exit(1);
  }
);