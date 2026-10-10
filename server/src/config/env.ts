import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/medilink_zimbabwe",
  jwtSecret: process.env.JWT_SECRET || "development_only_change_me",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
};

if (process.env.NODE_ENV === "production") {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "development_only_change_me" || process.env.JWT_SECRET.length < 32) throw new Error("Production requires an explicit JWT_SECRET of at least 32 characters.");
  if (!process.env.MONGODB_URI || !process.env.CLIENT_ORIGIN) throw new Error("Production requires explicit MONGODB_URI and CLIENT_ORIGIN.");
}
