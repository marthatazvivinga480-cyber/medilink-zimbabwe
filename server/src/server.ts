import { setServers } from "node:dns";
import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";

import { ensureAllDoctorsRollingAvailability } from "./services/doctorAvailabilityService.js";

const dnsServers = process.env.DNS_SERVERS?.split(",")
  .map((server) => server.trim())
  .filter(Boolean);

if (dnsServers?.length) {
  setServers(dnsServers);
}

async function start() {
  await connectDatabase();

  let refreshing = false;
  const refresh = async () => {
    if (refreshing) return;
    refreshing = true;
    try {
      await ensureAllDoctorsRollingAvailability();
    } catch (error) {
      console.error("Rolling availability refresh failed:", error);
    } finally {
      refreshing = false;
    }
  };
  await refresh();
  const refreshTimer = setInterval(
    () => {
      void refresh();
    },
    6 * 60 * 60 * 1000,
  );
  refreshTimer.unref();

  app.listen(env.port, () => {
    console.log(`MediLink API running on http://localhost:${env.port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
