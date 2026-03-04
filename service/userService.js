import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const loginUser = async (payload) => {
  const { username, password } = payload;

  const dbUser = await User.findOne({ username });
  if (!dbUser) return { status: "error", code: 404, message: "User not found" };

  const passwordMatch = await bcrypt.compare(password, dbUser.password);
  if (!passwordMatch) return { status: "error", code: 401, message: "Invalid credentials" };

  const jwtSecret = process.env.jwt_Secret;
  if (!jwtSecret) throw new Error("JWT secret missing in environment");

  const token = jwt.sign(
    {
      username: dbUser.username,
      email: dbUser.email,
      id: dbUser._id
    },
    jwtSecret,
    { expiresIn: "24h" }
  );
  const refreshtoken = jwt.sign(
    {
      username: dbUser.username,
      email: dbUser.email,
      id: dbUser._id
    },
    jwtSecret,
    { expiresIn: "7d" }
  );

  return { status: "success", token, refreshtoken };
};