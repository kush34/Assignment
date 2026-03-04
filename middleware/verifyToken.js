import jwt from "jsonwebtoken";
import User from "../models/userModel.js"
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies.token;
    console.log(cookieToken);
    console.log(authHeader);
    const token = (authHeader && authHeader.split(' ')[1]) || cookieToken;

    if (!token) return res.status(401).send('Please Login First');

    const secret = process.env.jwt_Secret;
    if (!secret) return res.status(500).send('Server misconfiguration: missing JWT secret');

    const result = jwt.verify(token, secret);
    if (!result) return res.status(401).send('pls login again');

    const userDB = await User.findById(result.id);
    if (!userDB) return res.status(401).send('invalid token.');

    req.username = result.username;
    req.email = result.email;
    req.id = result.id;

    next();
  } catch (error) {
    // error has unknown type in strict mode
    if (error instanceof Error) console.log(error.message);
    else console.log(error);
    return res.status(401).send('Invalid token');
  }
};

export default verifyToken;