import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { connectDatabase } from "./config/db.js";
import { User } from "./models/User.js";
import { Doctor } from "./models/Doctor.js";
import { DoctorAvailability } from "./models/DoctorAvailability.js";

const demoDoctors = [
  {
    name: "Dr. Tendai Moyo",
    email: "doctor@medilink.co.zw",
    phone: "+263 77 210 1001",
    speciality: "General Practice",
    qualifications: ["MBChB", "Primary Care Medicine"],
    biography:
      "General practitioner focused on preventive medicine, routine consultations and long-term patient care.",
    location: "Harare, Zimbabwe",
    facility: "MediLink Demo Medical Centre",
    registrationInfo: "Demo provider profile",
    photoUrl:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=900&q=80",
    languages: ["English", "Shona"],
    yearsOfExperience: 9,
    areasOfCare: [
      "General consultations",
      "Hypertension monitoring",
      "Respiratory illness",
      "Preventive health",
      "Diabetes follow-up",
    ],
    consultationTypes: ["In-person"],
  },
  {
    name: "Dr. Rutendo Chikowore",
    email: "rutendo.chikowore@medilink.demo",
    phone: "+263 77 210 1002",
    speciality: "Paediatrics",
    qualifications: ["MBChB", "MMed Paediatrics"],
    biography:
      "Paediatric doctor providing child health reviews, developmental assessments and management of common childhood illnesses.",
    location: "Harare, Zimbabwe",
    facility: "MediLink Demo Children's Clinic",
    registrationInfo: "Demo provider profile",
    photoUrl:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=900&q=80",
    languages: ["English", "Shona"],
    yearsOfExperience: 7,
    areasOfCare: [
      "Child wellness",
      "Respiratory infections",
      "Growth monitoring",
      "Childhood illness",
    ],
    consultationTypes: ["In-person"],
  },
  {
    name: "Dr. Tinashe Ncube",
    email: "tinashe.ncube@medilink.demo",
    phone: "+263 71 210 1003",
    speciality: "Cardiology",
    qualifications: ["MBChB", "MMed", "Cardiology"],
    biography:
      "Cardiology-focused physician supporting assessment and management of cardiovascular conditions.",
    location: "Bulawayo, Zimbabwe",
    facility: "MediLink Demo Heart Clinic",
    registrationInfo: "Demo provider profile",
    photoUrl:
      "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=900&q=80",
    languages: ["English", "Ndebele"],
    yearsOfExperience: 12,
    areasOfCare: [
      "Hypertension",
      "Cardiac assessment",
      "Heart disease follow-up",
      "Cardiovascular risk",
    ],
    consultationTypes: ["In-person"],
  },
  {
    name: "Dr. Nyasha Mupfumi",
    email: "nyasha.mupfumi@medilink.demo",
    phone: "+263 78 210 1004",
    speciality: "Dermatology",
    qualifications: ["MBChB", "Dermatology"],
    biography:
      "Dermatology practitioner focused on assessment and treatment of common skin, hair and nail conditions.",
    location: "Harare, Zimbabwe",
    facility: "MediLink Demo Skin Clinic",
    registrationInfo: "Demo provider profile",
    photoUrl:
      "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=900&q=80",
    languages: ["English", "Shona"],
    yearsOfExperience: 6,
    areasOfCare: [
      "Acne",
      "Eczema",
      "Skin infections",
      "Hair and scalp conditions",
    ],
    consultationTypes: ["In-person"],
  },
  {
    name: "Dr. Farai Dube",
    email: "farai.dube@medilink.demo",
    phone: "+263 71 210 1005",
    speciality: "Orthopaedics",
    qualifications: ["MBChB", "Orthopaedic Surgery"],
    biography:
      "Orthopaedic practitioner supporting patients with musculoskeletal injuries, joint problems and follow-up care.",
    location: "Bulawayo, Zimbabwe",
    facility: "MediLink Demo Orthopaedic Centre",
    registrationInfo: "Demo provider profile",
    photoUrl:
      "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=900&q=80",
    languages: ["English", "Ndebele"],
    yearsOfExperience: 10,
    areasOfCare: [
      "Joint pain",
      "Sports injuries",
      "Fracture follow-up",
      "Musculoskeletal assessment",
    ],
    consultationTypes: ["In-person"],
  },
  {
    name: "Dr. Tariro Maposa",
    email: "tariro.maposa@medilink.demo",
    phone: "+263 77 210 1006",
    speciality: "Obstetrics & Gynaecology",
    qualifications: ["MBChB", "MMed Obstetrics & Gynaecology"],
    biography:
      "Women's health practitioner providing gynaecological consultations and antenatal care.",
    location: "Harare, Zimbabwe",
    facility: "MediLink Demo Women's Health Centre",
    registrationInfo: "Demo provider profile",
    photoUrl:
      "https://images.unsplash.com/photo-1550831107-1553da8c8464?auto=format&fit=crop&w=900&q=80",
    languages: ["English", "Shona"],
    yearsOfExperience: 11,
    areasOfCare: [
      "Women's health",
      "Antenatal care",
      "Gynaecological consultation",
      "Reproductive health",
    ],
    consultationTypes: ["In-person"],
  },
];

function dateAfter(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return date.toISOString().slice(0, 10);
}

async function seedDoctors(): Promise<void> {
  await connectDatabase();

  console.log("\nSeeding demo doctors...");

  for (const data of demoDoctors) {
    let user = await User.findOne({
      email: data.email,
    });

    if (!user) {
      user = await User.create({
        name: data.name,
        email: data.email,
        passwordHash: await bcrypt.hash("Doctor123!", 12),
        role: "doctor",
        phone: data.phone,
      });
    } else {
      user.name = data.name;
      user.phone = data.phone;

      await user.save();
    }

    const doctor = await Doctor.findOneAndUpdate(
      {
        userId: user._id,
      },
      {
        $set: {
          userId: user._id,
          speciality: data.speciality,
          qualifications: data.qualifications,
          biography: data.biography,
          location: data.location,
          facility: data.facility,
          registrationInfo: data.registrationInfo,
          photoUrl: data.photoUrl,
          languages: data.languages,
          yearsOfExperience: data.yearsOfExperience,
          areasOfCare: data.areasOfCare,
          consultationTypes: data.consultationTypes,
          isVerified: true,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    for (let day = 1; day <= 7; day++) {
      const date = dateAfter(day);

      // Add default slots only when this doctor's date has no record.
      // Existing availability and booking statuses are left unchanged.
      await DoctorAvailability.updateOne(
        {
          doctorId: doctor._id,
          date,
        },
        {
          $setOnInsert: {
            doctorId: doctor._id,
            date,
            slots: [
              {
                startTime: "08:30",
                endTime: "09:00",
                isBooked: false,
              },
              {
                startTime: "09:30",
                endTime: "10:00",
                isBooked: false,
              },
              {
                startTime: "11:00",
                endTime: "11:30",
                isBooked: false,
              },
              {
                startTime: "14:00",
                endTime: "14:30",
                isBooked: false,
              },
              {
                startTime: "15:30",
                endTime: "16:00",
                isBooked: false,
              },
            ],
          },
        },
        {
          upsert: true,
          runValidators: true,
        }
      );
    }

    console.log(`✓ ${data.name}`);
  }

  console.log("\nDemo doctors ready.");
  console.log("Demo password: Doctor123!");
  console.log("These are fictional demo provider profiles.\n");
}

seedDoctors()
  .catch((error: unknown) => {
    console.error("Failed to seed demo doctors:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  })
