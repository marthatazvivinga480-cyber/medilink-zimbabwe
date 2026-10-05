import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true, index: true },
  date: { type: String, required: true },
  slots: [{
    startTime: String,
    endTime: String,
    isBooked: { type: Boolean, default: false }
  }]
}, { timestamps: true });

availabilitySchema.index({ doctorId: 1, date: 1 }, { unique: true });

export const DoctorAvailability = mongoose.model("DoctorAvailability", availabilitySchema);
