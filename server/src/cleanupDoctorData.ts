import mongoose from "mongoose";

import { connectDatabase } from "./config/db.js";
import { User } from "./models/User.js";
import { Doctor } from "./models/Doctor.js";

type DoctorUpdate = {
  email: string;

  user?: {
    name?: string;
    phone?: string;
  };

  doctor: {
    speciality?: string;
    qualifications?: string[];
    biography?: string;
    location?: string;
    facility?: string;
    areasOfCare?: string[];
    photoUrl?: string;
  };
};

async function cleanupDoctorData() {
  await connectDatabase();

  console.log("\nCleaning doctor data...");

  const updates: DoctorUpdate[] = [
    {
      email: "doctor@medilink.co.zw",

      user: {
        name: "Dr. Tendai Moyo",
        phone: "+263 77 210 1001",
      },

      doctor: {
        speciality: "General Practice",

        facility: "MediLink Medical Centre",

        qualifications: [
          "MBChB",
          "Primary Care Medicine",
        ],

        biography:
          "General practitioner focused on preventive medicine, routine consultations and long-term patient care.",

        location: "Harare, Zimbabwe",

        areasOfCare: [
          "General consultations",
          "Hypertension monitoring",
          "Respiratory illness",
          "Preventive health",
          "Diabetes follow-up",
        ],

        photoUrl:
          "/images/doctors/tendai-moyo.png",
      },
    },

    {
      email: "rutendo.chikowore@medilink.demo",

      user: {
        name: "Dr. Rutendo Chikowore",
        phone: "+263 77 210 1002",
      },

      doctor: {
        speciality: "Paediatrics",

        facility: "MediLink Children's Clinic",

        location: "Harare, Zimbabwe",

        biography:
          "Paediatric doctor providing child health reviews, developmental assessments and management of common childhood illnesses.",

        areasOfCare: [
          "Child wellness",
          "Respiratory infections",
          "Growth monitoring",
          "Childhood illness",
        ],

        photoUrl:
          "/images/doctors/rutendo-chikowore.jpg",
      },
    },

    {
      email: "tinashe.ncube@medilink.demo",

      user: {
        name: "Dr. Tinashe Ncube",
        phone: "+263 71 210 1003",
      },

      doctor: {
        speciality: "Cardiology",

        facility: "MediLink Heart Clinic",

        location: "Bulawayo, Zimbabwe",

        biography:
          "Cardiology-focused physician supporting assessment and management of cardiovascular conditions.",

        photoUrl:
          "/images/doctors/tinashe-ncube.png",
      },
    },

    {
      email: "nyasha.mupfumi@medilink.demo",

      user: {
        name: "Dr. Nyasha Mupfumi",
        phone: "+263 78 210 1004",
      },

      doctor: {
        speciality: "Dermatology",

        facility: "MediLink Skin Clinic",

        location: "Harare, Zimbabwe",

        biography:
          "Dermatology practitioner focused on assessment and treatment of common skin, hair and nail conditions.",

        photoUrl:
          "/images/doctors/nyasha-mupfumi.png",
      },
    },

    {
      email: "farai.dube@medilink.demo",

      user: {
        name: "Dr. Farai Dube",
        phone: "+263 71 210 1005",
      },

      doctor: {
        speciality: "Orthopaedics",

        facility: "MediLink Orthopaedic Centre",

        location: "Bulawayo, Zimbabwe",

        biography:
          "Orthopaedic practitioner supporting patients with musculoskeletal injuries, joint problems and follow-up care.",

        photoUrl:
          "/images/doctors/farai-dube.jpg",
      },
    },

    {
      email: "tariro.maposa@medilink.demo",

      user: {
        name: "Dr. Tariro Maposa",
        phone: "+263 77 210 1006",
      },

      doctor: {
        speciality:
          "Obstetrics & Gynaecology",

        facility:
          "MediLink Women's Health Centre",

        qualifications: [
          "MBChB",
          "MMed Obstetrics & Gynaecology",
        ],

        location: "Harare, Zimbabwe",

        areasOfCare: [
          "Women's health",
          "Antenatal care",
          "Gynaecological consultation",
          "Reproductive health",
        ],

        biography:
          "Women's health practitioner providing gynaecological consultations and antenatal care.",

        photoUrl:
          "/images/doctors/tariro-maposa.png",
      },
    },
  ];

  for (const item of updates) {
    const user = await User.findOne({
      email: item.email,
    });

    if (!user) {
      console.log(
        `Skipped: ${item.email} was not found.`
      );

      continue;
    }

    if (item.user?.name) {
      user.name = item.user.name;
    }

    if (item.user?.phone) {
      user.phone = item.user.phone;
    }

    await user.save();

    const doctor =
      await Doctor.findOneAndUpdate(
        {
          userId: user._id,
        },
        {
          $set: item.doctor,
        },
        {
          returnDocument: "after",
        }
      );

    if (!doctor) {
      console.log(
        `Skipped: doctor profile for ${item.email} was not found.`
      );

      continue;
    }

    console.log(`✓ ${user.name}`);
  }

  console.log(
    "\nDoctor data cleanup complete.\n"
  );

  await mongoose.disconnect();
}

cleanupDoctorData().catch(
  async (error) => {
    console.error(
      "Doctor data cleanup failed:",
      error
    );

    await mongoose.disconnect();

    process.exit(1);
  }
);