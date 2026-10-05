export type Role =
  | "patient"
  | "doctor"
  | "pharmacy"
  | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
}

export interface DoctorUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface Doctor {
  _id: string;
  userId: DoctorUser;

  speciality: string;
  qualifications: string[];

  biography?: string;
  location?: string;
  registrationInfo?: string;

  photoUrl?: string;
  facility?: string;

  languages?: string[];

  yearsOfExperience?: number;

  areasOfCare?: string[];

  consultationTypes?: string[];

  isVerified?: boolean;

  createdAt?: string;
  updatedAt?: string;
}

export interface Appointment {
  _id: string;

  date: string;
  startTime: string;
  endTime: string;

  reason: string;
  status: string;

  doctorId?: Doctor;

  patientId?: {
    _id: string;
    userId: {
      name: string;
      email: string;
      phone?: string;
    };
  };
}

export interface RecordItem {
  _id: string;

  diagnosis: string;
  diagnosisExplanation?: string;

  symptoms?: string;
  observations?: string;
  treatment?: string;
  followUp?: string;

  createdAt: string;

  doctorId?: {
    userId?: {
      name: string;
    };
  };
}

export interface PrescriptionMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface Prescription {
  _id: string;

  prescriptionCode: string;

  medicines: PrescriptionMedicine[];

  instructions?: string;

  issuedAt: string;
  expiresAt?: string;

  status: string;

  doctorId?: {
    userId?: {
      name: string;
    };
  };
}

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface DoctorAvailability {
  _id?: string;
  doctorId?: string;
  date: string;
  slots: AvailabilitySlot[];
}