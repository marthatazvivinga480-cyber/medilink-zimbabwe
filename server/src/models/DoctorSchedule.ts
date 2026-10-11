import mongoose from "mongoose";

const timeRangeSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
  },
  {
    _id: false,
  },
);

const workingDaySchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    enabled: {
      type: Boolean,
      default: false,
    },
    startTime: {
      type: String,
      default: "08:00",
    },
    endTime: {
      type: String,
      default: "16:00",
    },
    breaks: {
      type: [timeRangeSchema],
      default: [],
    },
  },
  {
    _id: false,
  },
);

const doctorScheduleSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      unique: true,
      index: true,
    },

    slotDurationMinutes: {
      type: Number,
      default: 30,
      min: 15,
      max: 180,
    },

    workingDays: {
      type: [workingDaySchema],
      default: [],
    },

    blockedDates: {
      type: [String],
      default: [],
    },

    bookingWindowDays: {
      type: Number,
      default: 30,
      min: 1,
      max: 90,
    },
  },
  {
    timestamps: true,
  },
);

export const DoctorSchedule = mongoose.model(
  "DoctorSchedule",
  doctorScheduleSchema,
);
