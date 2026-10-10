import {
  Schema,
  model,
  type Document,
  type Types,
} from "mongoose";

export type NotificationType =
  | "appointment_confirmed"
  | "appointment_rescheduled"
  | "appointment_cancelled"
  | "appointment_reminder"
  | "prescription_issued"
  | "medical_record_added"
  | "payment_updated"
  | "general";

export interface NotificationDocument
  extends Document {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema =
  new Schema<NotificationDocument>(
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      type: {
        type: String,
        enum: [
          "appointment_confirmed",
          "appointment_rescheduled",
          "appointment_cancelled",
          "appointment_reminder",
          "prescription_issued",
          "medical_record_added",
          "payment_updated",
          "general",
        ],
        required: true,
        default: "general",
      },

      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150,
      },

      message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
      },

      link: {
        type: String,
        trim: true,
      },

      isRead: {
        type: Boolean,
        default: false,
        index: true,
      },
    },
    {
      timestamps: true,
    }
  );

notificationSchema.index({
  userId: 1,
  createdAt: -1,
});

notificationSchema.index({
  userId: 1,
  isRead: 1,
  createdAt: -1,
});

export const Notification =
  model<NotificationDocument>(
    "Notification",
    notificationSchema
  );

export default Notification;