import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

import { User } from "../models/User.js";
import { Patient } from "../models/Patient.js";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
});

function tokenFor(user: any) {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
    },
    env.jwtSecret,
    {
      expiresIn: "1d",
    }
  );
}

router.post("/register", async (req, res, next) => {
  try {
    const data =
      registerSchema.parse(req.body);

    const email =
      data.email.toLowerCase();

    const exists =
      await User.findOne({
        email,
      });

    if (exists) {
      return res
        .status(409)
        .json({
          message:
            "An account with that email already exists.",
        });
    }

    const passwordHash =
      await bcrypt.hash(
        data.password,
        12
      );

    const user =
      await User.create({
        name: data.name,
        email,
        passwordHash,
        role: "patient",
        phone: data.phone,
        isActive: true,
      });

    try {
      await Patient.create({
        userId: user._id,
        allergies: [],
        existingConditions: [],
      });
    } catch (error) {
      await User.findByIdAndDelete(
        user._id
      );

      throw error;
    }

    return res
      .status(201)
      .json({
        token: tokenFor(user),

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const data = z
      .object({
        email:
          z.string().email(),

        password:
          z.string(),
      })
      .parse(req.body);

    const user =
      await User.findOne({
        email:
          data.email.toLowerCase(),
      });

    if (
      !user ||
      !(await bcrypt.compare(
        data.password,
        user.passwordHash
      ))
    ) {
      return res
        .status(401)
        .json({
          message:
            "Invalid email or password.",
        });
    }

    if (
      user.isActive === false
    ) {
      return res
        .status(403)
        .json({
          message:
            "This account has been deactivated. Please contact a MediLink administrator.",
        });
    }

    return res.json({
      token: tokenFor(user),

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get(
  "/me",
  requireAuth,
  async (req, res, next) => {
    try {
      const user =
        await User.findById(
          req.user!.id
        ).select(
          "_id name email role phone isActive"
        );

      if (!user) {
        return res
          .status(404)
          .json({
            message:
              "User account was not found.",
          });
      }

      return res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          isActive:
            user.isActive,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;