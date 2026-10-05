import "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role:
          | "patient"
          | "doctor"
          | "pharmacy"
          | "admin";
        email: string;
      };
    }
  }
}

export {};