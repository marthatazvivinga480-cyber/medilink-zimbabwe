import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/medilink_zimbabwe",
  jwtSecret: process.env.JWT_SECRET || "development_only_change_me",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
};
