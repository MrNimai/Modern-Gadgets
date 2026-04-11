const http = require("http");
const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, ".data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const COOKIE_NAME = "tv_session";

const SESSION_SECRET =
  process.env.TECHVERSE_SESSION_SECRET ||
  process.env.SESSION_SECRET ||
  "dev-secret-change-me";

const sessions = new Map(); // sessionId -> { userId, expiresAt }
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

function now() {
  return Date.now();
}

function base64urlEncode(buffer) {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecodeToBuffer(str) {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  return Buffer.from(padded, "base64");
}

function sign(value) {
  const mac = crypto.createHmac("sha256", SESSION_SECRET).update(value).digest();
  return `${value}.${base64urlEncode(mac)}`;
}

function verifySigned(signedValue) {
  if (!signedValue) return null;
  const idx = signedValue.lastIndexOf(".");
  if (idx <= 0) return null;
  const value = signedValue.slice(0, idx);
  const sig = signedValue.slice(idx + 1);
  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(value).digest();
  const provided = base64urlDecodeToBuffer(sig);
  if (provided.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(provided, expected)) return null;
  return value;
}

async function ensureDataDir() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  try {
    await fsp.access(USERS_FILE, fs.constants.F_OK);
  } catch {
    await fsp.writeFile(USERS_FILE, JSON.stringify({ users: [] }, null, 2), "utf8");
  }
}

async function readUsers() {
  await ensureDataDir();
  const raw = await fsp.readFile(USERS_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.users)) return { users: [] };
    return parsed;
  } catch {
    return { users: [] };
  }
}

async function writeUsers(data) {
  await ensureDataDir();
  const tmp = `${USERS_FILE}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fsp.rename(tmp, USERS_FILE);
}

function json(res, statusCode, body) {
  const payload = JSON.stringify(body);
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  };
  res.writeHead(statusCode, headers);
  res.end(payload);
}

function notFound(res) {
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
}

function badRequest(res, message) {
  json(res, 400, { ok: false, error: message || "Bad request" });
}

function unauthorized(res) {
  json(res, 401, { ok: false, error: "Unauthorized" });
}

function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) return {};
  const parts = header.split(";").map((p) => p.trim());
  const out = {};
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    out[k] = decodeURIComponent(v);
  }
  return out;
}

function setCookie(res, name, value, options) {
  const opts = options || {};
  const pieces = [`${name}=${encodeURIComponent(value)}`];
  if (opts.maxAge != null) pieces.push(`Max-Age=${Math.floor(opts.maxAge)}`);
  if (opts.httpOnly) pieces.push("HttpOnly");
  if (opts.sameSite) pieces.push(`SameSite=${opts.sameSite}`);
  if (opts.path) pieces.push(`Path=${opts.path}`);
  if (opts.secure) pieces.push("Secure");
  res.setHeader("Set-Cookie", pieces.join("; "));
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name || "",
    phone: user.phone || "",
    address: user.address || "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function pbkdf2Hash(password, saltB64) {
  const salt = saltB64 ? Buffer.from(saltB64, "base64") : crypto.randomBytes(16);
  const iterations = 150000;
  const keylen = 32;
  const digest = "sha256";
  const derived = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest);
  return {
    salt: salt.toString("base64"),
    hash: derived.toString("base64"),
    iterations,
    digest,
    keylen,
  };
}

function verifyPassword(password, record) {
  if (!record || !record.salt || !record.passwordHash) return false;
  const { hash } = pbkdf2Hash(password, record.salt);
  const a = Buffer.from(hash, "base64");
  const b = Buffer.from(record.passwordHash, "base64");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  const e = normalizeEmail(email);
  return e.length >= 5 && e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function isValidPassword(password) {
  const p = String(password || "");
  return p.length >= 6 && p.length <= 200;
}

async function readJsonBody(req) {
  return await new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1024 * 200) {
        reject(new Error("Body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function getSession(req) {
  const cookies = parseCookies(req);
  const signed = cookies[COOKIE_NAME];
  const sessionId = verifySigned(signed);
  if (!sessionId) return null;

  const entry = sessions.get(sessionId);
  if (!entry) return null;
  if (entry.expiresAt <= now()) {
    sessions.delete(sessionId);
    return null;
  }
  return { sessionId, ...entry };
}

function createSession(res, userId) {
  const sessionId = base64urlEncode(crypto.randomBytes(32));
  const expiresAt = now() + SESSION_TTL_MS;
  sessions.set(sessionId, { userId, expiresAt });
  const signed = sign(sessionId);
  setCookie(res, COOKIE_NAME, signed, {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

function clearSession(res) {
  setCookie(res, COOKIE_NAME, "deleted", {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 0,
  });
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (!origin || !ALLOWED_ORIGINS.has(origin)) {
    return false;
  }

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Vary", "Origin");
  return true;
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".js") return "application/javascript; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".ico") return "image/x-icon";
  return "application/octet-stream";
}

function safeJoin(root, requestPath) {
  const decoded = decodeURIComponent(requestPath);
  const normalized = path.normalize(decoded).replace(/^([/\\])+/, "");
  const joined = path.join(root, normalized);
  const rel = path.relative(root, joined);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return joined;
}

async function serveStatic(req, res, pathname) {
  const target = pathname === "/" ? "/index.html" : pathname;
  const filePath = safeJoin(ROOT_DIR, target);
  if (!filePath) return notFound(res);

  let stat;
  try {
    stat = await fsp.stat(filePath);
  } catch {
    return notFound(res);
  }
  if (!stat.isFile()) return notFound(res);

  const ctype = contentTypeFor(filePath);
  res.writeHead(200, {
    "Content-Type": ctype,
    "Cache-Control": filePath.endsWith(".html") ? "no-store" : "public, max-age=300",
  });
  fs.createReadStream(filePath).pipe(res);
}

async function handleApi(req, res, pathname) {
  if (req.method === "POST" && pathname === "/api/auth/signup") {
    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      return badRequest(res, "Invalid JSON body");
    }

    const email = normalizeEmail(body.email);
    const password = String(body.password || "");
    const name = String(body.name || "").trim();

    if (!isValidEmail(email)) return badRequest(res, "Please enter a valid email.");
    if (!isValidPassword(password)) return badRequest(res, "Password must be at least 6 characters.");

    const store = await readUsers();
    const exists = store.users.find((u) => normalizeEmail(u.email) === email);
    if (exists) return json(res, 409, { ok: false, error: "Email already registered." });

    const id = base64urlEncode(crypto.randomBytes(12));
    const ts = new Date().toISOString();
    const { salt, hash } = pbkdf2Hash(password);
    const user = {
      id,
      email,
      name,
      phone: "",
      address: "",
      passwordHash: hash,
      salt,
      createdAt: ts,
      updatedAt: ts,
    };
    store.users.push(user);
    await writeUsers(store);

    createSession(res, id);
    return json(res, 200, { ok: true, user: sanitizeUser(user) });
  }

  if (req.method === "POST" && pathname === "/api/auth/login") {
    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      return badRequest(res, "Invalid JSON body");
    }

    const email = normalizeEmail(body.email);
    const password = String(body.password || "");
    if (!isValidEmail(email)) return badRequest(res, "Please enter a valid email.");
    if (!password) return badRequest(res, "Password is required.");

    const store = await readUsers();
    const user = store.users.find((u) => normalizeEmail(u.email) === email);
    if (!user || !verifyPassword(password, user)) {
      return json(res, 401, { ok: false, error: "Invalid email or password." });
    }

    createSession(res, user.id);
    return json(res, 200, { ok: true, user: sanitizeUser(user) });
  }

  if (req.method === "POST" && pathname === "/api/auth/logout") {
    const session = getSession(req);
    if (session) sessions.delete(session.sessionId);
    clearSession(res);
    return json(res, 200, { ok: true });
  }

  if (req.method === "GET" && pathname === "/api/me") {
    const session = getSession(req);
    if (!session) return json(res, 200, { ok: true, user: null });
    const store = await readUsers();
    const user = store.users.find((u) => u.id === session.userId);
    if (!user) return json(res, 200, { ok: true, user: null });
    return json(res, 200, { ok: true, user: sanitizeUser(user) });
  }

  if (req.method === "POST" && pathname === "/api/profile") {
    const session = getSession(req);
    if (!session) return unauthorized(res);

    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      return badRequest(res, "Invalid JSON body");
    }

    const store = await readUsers();
    const idx = store.users.findIndex((u) => u.id === session.userId);
    if (idx < 0) return unauthorized(res);

    const name = String(body.name || "").trim().slice(0, 120);
    const phone = String(body.phone || "").trim().slice(0, 40);
    const address = String(body.address || "").trim().slice(0, 300);

    store.users[idx] = {
      ...store.users[idx],
      name,
      phone,
      address,
      updatedAt: new Date().toISOString(),
    };
    await writeUsers(store);
    return json(res, 200, { ok: true, user: sanitizeUser(store.users[idx]) });
  }

  return notFound(res);
}

async function handler(req, res) {
  const url = new URL(req.url, "http://localhost");
  const pathname = url.pathname;

  if (pathname.startsWith("/api/")) {
    applyCors(req, res);

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }

    try {
      return await handleApi(req, res, pathname);
    } catch (err) {
      return json(res, 500, { ok: false, error: "Server error" });
    }
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Method not allowed");
  }

  return await serveStatic(req, res, pathname);
}

async function main() {
  await ensureDataDir();
  const port = Number(process.env.PORT || 5173);
  const server = http.createServer((req, res) => {
    handler(req, res);
  });
  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`TechVerse server running on http://localhost:${port}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
