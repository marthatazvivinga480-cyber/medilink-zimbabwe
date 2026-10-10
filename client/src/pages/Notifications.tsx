import LoadingState from "../components/ui/LoadingState";
import {
  ArrowLeft,
  Bell,
  CalendarCheck2,
  Check,
  CheckCheck,
  FileHeart,
  Info,
  Pill,
  RefreshCw,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import { api } from "../services/api";

type NotificationType =
  | "appointment_confirmed"
  | "appointment_rescheduled"
  | "appointment_cancelled"
  | "appointment_reminder"
  | "prescription_issued"
  | "medical_record_added"
  | "payment_updated"
  | "general";

type NotificationItem = {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
};

function formatNotificationDate(
  value: string
) {
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleString(
    "en-ZW",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function notificationIcon(
  type: NotificationType
) {
  switch (type) {
    case "appointment_confirmed":
    case "appointment_rescheduled":
    case "appointment_cancelled":
    case "appointment_reminder":
      return CalendarCheck2;

    case "prescription_issued":
      return Pill;

    case "medical_record_added":
      return FileHeart;

    default:
      return Info;
  }
}

function notificationLabel(
  type: NotificationType
) {
  switch (type) {
    case "payment_updated":
      return "Payment or medical aid";
    case "appointment_confirmed":
      return "Appointment confirmed";

    case "appointment_rescheduled":
      return "Appointment rescheduled";

    case "appointment_cancelled":
      return "Appointment cancelled";

    case "appointment_reminder":
      return "Appointment reminder";

    case "prescription_issued":
      return "Prescription";

    case "medical_record_added":
      return "Medical record";

    default:
      return "Notification";
  }
}

function notificationDestination(notification: NotificationItem) {
  if (notification.link?.startsWith("/") && !notification.link.startsWith("//")) return notification.link;
  const type = notification.type || "";
  if (type.includes("payment") || type.includes("medical_aid")) return "/dashboard/patient/payments";
  if (type.includes("prescription")) return "/dashboard/patient/prescriptions";
  if (type.includes("record") || type.includes("consultation")) return "/dashboard/patient/records";
  if (type.includes("appointment")) return "/dashboard/patient/appointments";
  return undefined;
}
export default function Notifications() {
  const navigate =
    useNavigate();

  const [
    notifications,
    setNotifications,
  ] = useState<
    NotificationItem[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    markingAll,
    setMarkingAll,
  ] = useState(false);

  async function loadNotifications(
    showRefreshState = false
  ) {
    try {
      if (
        showRefreshState
      ) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response =
        await api.get(
          "/notifications"
        );

      setNotifications(
        Array.isArray(
          response.data
            ?.notifications
        )
          ? response.data
              .notifications
          : []
      );
    } catch (
      error: any
    ) {
      setError(
        error.response?.data
          ?.message ||
          "Your notifications could not be loaded."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, []);

  const unreadCount =
    useMemo(
      () =>
        notifications.filter(
          (
            notification
          ) =>
            !notification.isRead
        ).length,
      [notifications]
    );

  async function markAsRead(
    notification: NotificationItem
  ) {
    if (
      notification.isRead
    ) {
      if (
        notificationDestination(notification)
      ) {
        navigate(notificationDestination(notification)!);
      }

      return;
    }

    try {
      await api.patch(
        `/notifications/${notification._id}/read`
      );

      setNotifications(
        (
          current
        ) =>
          current.map(
            (
              item
            ) =>
              item._id ===
              notification._id
                ? {
                    ...item,
                    isRead:
                      true,
                  }
                : item
          )
      );

      if (
        notificationDestination(notification)
      ) {
        navigate(notificationDestination(notification)!);
      }
    } catch (
      error: any
    ) {
      setError(
        error.response?.data
          ?.message ||
          "This notification could not be updated."
      );
    }
  }

  async function markAllAsRead() {
    if (
      unreadCount === 0
    ) {
      return;
    }

    try {
      setMarkingAll(true);
      setError("");

      await api.patch(
        "/notifications/read-all"
      );

      setNotifications(
        (
          current
        ) =>
          current.map(
            (
              notification
            ) => ({
              ...notification,
              isRead: true,
            })
          )
      );
    } catch (
      error: any
    ) {
      setError(
        error.response?.data
          ?.message ||
          "Notifications could not be marked as read."
      );
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FBFC]">
      <section className="border-b border-[#E2EBEF] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-9 lg:px-8">
          <Link
            to="/dashboard/patient"
            className="inline-flex items-center gap-2 text-sm font-semibold text-teal transition hover:text-navy"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>

          <div className="mt-6 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal">
                Patient notifications
              </p>

              <h1 className="mt-2 font-display text-3xl font-extrabold text-navy md:text-4xl">
                Notifications
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#647583] md:text-base">
                Keep track of appointment updates,
                medical records and prescriptions
                linked to your MediLink account.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-[#E2EBEF] bg-[#F5FAFB] px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7A8995]">
                  Unread
                </p>

                <p className="mt-1 text-2xl font-bold text-navy">
                  {
                    unreadCount
                  }
                </p>
              </div>

              <div className="rounded-2xl border border-[#E2EBEF] bg-[#F5FAFB] px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7A8995]">
                  Total
                </p>

                <p className="mt-1 text-2xl font-bold text-navy">
                  {
                    notifications.length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-xl font-bold text-navy">
              Recent notifications
            </h2>

            <p className="mt-1 text-sm text-[#647583]">
              Newest updates appear first.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                void loadNotifications(
                  true
                )
              }
              disabled={
                refreshing
              }
              className="btn-secondary gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />

              Refresh
            </button>

            <button
              type="button"
              onClick={() =>
                void markAllAsRead()
              }
              disabled={
                markingAll ||
                unreadCount === 0
              }
              className="btn-primary gap-2"
            >
              <CheckCheck className="h-4 w-4" />

              {markingAll
                ? "Updating..."
                : "Mark all as read"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <LoadingState label="Loading your notifications" />
        ) : notifications.length ===
          0 ? (
          <div className="card mt-6 flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF8FA] text-teal">
              <Bell className="h-6 w-6" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-navy">
              No notifications yet
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-[#647583]">
              Appointment updates, prescriptions
              and medical record notifications will
              appear here when they are created.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {notifications.map(
              (
                notification
              ) => {
                const Icon =
                  notificationIcon(
                    notification.type
                  );

                return (
                  <button
                    key={
                      notification._id
                    }
                    type="button"
                    onClick={() =>
                      void markAsRead(
                        notification
                      )
                    }
                    className={`w-full rounded-2xl border p-5 text-left shadow-[0_10px_30px_rgba(11,41,69,0.04)] transition ${
                      notification.isRead
                        ? "border-[#E2EBEF] bg-white hover:border-[#CFE3E6]"
                        : "border-[#BDE1E5] bg-[#F4FBFC] hover:border-teal"
                    }`}
                  >
                    <div className="flex gap-4">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          notification.isRead
                            ? "bg-[#F2F6F7] text-[#647583]"
                            : "bg-[#E3F7F9] text-teal"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-navy">
                                {
                                  notification.title
                                }
                              </p>

                              {!notification.isRead && (
                                <span className="rounded-full bg-teal px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                  New
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-teal">
                              {notificationLabel(
                                notification.type
                              )}
                            </p>
                          </div>

                          <p className="shrink-0 text-xs text-[#82909A]">
                            {formatNotificationDate(
                              notification.createdAt
                            )}
                          </p>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-[#52616C]">
                          {
                            notification.message
                          }
                        </p>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                          <div className="inline-flex items-center gap-2 text-xs font-medium text-[#7A8995]">
                            {notification.isRead ? (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                Read
                              </>
                            ) : (
                              <>
                                <Bell className="h-3.5 w-3.5" />
                                Unread
                              </>
                            )}
                          </div>

                          {notificationDestination(notification) && (
                            <span className="text-sm font-semibold text-teal">
                              Open details →
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              }
            )}
          </div>
        )}
      </section>
    </main>
  );
}