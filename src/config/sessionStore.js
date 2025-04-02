import session from "express-session";
import pgSession from "connect-pg-simple";
import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config();

const pgStore = pgSession(session);

// ✅ Use `pool` instead of `Pool`
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // ✅ Allow self-signed certs
});

const sessionMiddleware = session({
  store: new pgStore({ pool, tableName: "Session" }), // ✅ Use `pool`
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 1 day
});

export default sessionMiddleware;
