import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: String,
  entityType: String,
  entityId: String,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
