import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

/** Cookie settings */
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,                        // 7 days in ms
};

/**
 * Signs a JWT containing the user's ID.
 * @param userId MongoDB ObjectId as a string
 * @returns Signed JWT string valid for 7 days
 */
function signToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: "7d" });
}

/**
 * POST /api/auth/register
 *
 * Creates a new user account, hashes the password with bcrypt, and sets
 * a JWT httpOnly cookie on success.
 *
 * @returns 201 { user: { _id, email, name } } on success
 * @returns 409 if the email is already registered
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, name } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ message: "Email already in use" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, name });

    const token = signToken(String(user._id));
    res.cookie("token", token, COOKIE_OPTIONS);
    res.status(201).json({ user: { _id: user._id, email: user.email, name: user.name } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 *
 * Validates credentials and sets a fresh JWT httpOnly cookie on success.
 * Returns the same 401 message for both unknown email and wrong password
 * to avoid user enumeration.
 *
 * @returns 200 { user: { _id, email, name } } on success
 * @returns 401 if credentials are invalid
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = signToken(String(user._id));
    res.cookie("token", token, COOKIE_OPTIONS);
    res.status(200).json({ user: { _id: user._id, email: user.email, name: user.name } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 *
 * Clears the JWT cookie.
 *
 * @returns 204 No Content
 */
export function logout(_req: Request, res: Response): void {
  res.clearCookie("token", COOKIE_OPTIONS);
  res.sendStatus(204);
}
