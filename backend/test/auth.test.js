import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import express from "express";
import jwt from "jsonwebtoken";

process.env.ADMIN_USERNAME = "test-admin";
process.env.ADMIN_PASSWORD = "test-password";
process.env.JWT_SECRET = "test-secret-that-is-long-enough-for-jwt-signing";
process.env.DATABASE_URL = "postgresql://test:test@127.0.0.1:5432/test";

const [{ default: authRoutes }, { default: requireAuth }, { default: queueRoutes }] = await Promise.all([
  import("../src/routes/authRoutes.js"),
  import("../src/middleware/requireAuth.js"),
  import("../src/routes/queueRoutes.js"),
]);

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/queue", queueRoutes);
app.get("/protected", requireAuth, (req, res) => res.json({ username: req.admin.username }));

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("login rejects missing or invalid credentials", async () => {
  const missing = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "", password: "" }),
  });
  assert.equal(missing.status, 400);

  const invalid = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "test-admin", password: "wrong" }),
  });
  assert.equal(invalid.status, 401);
});

test("login issues an eight-hour JWT accepted by protected routes", async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "test-admin", password: "test-password" }),
  });
  assert.equal(response.status, 200);

  const { token } = await response.json();
  const claims = jwt.verify(token, process.env.JWT_SECRET);
  assert.equal(claims.sub, "test-admin");
  assert.equal(claims.exp - claims.iat, 8 * 60 * 60);

  const protectedResponse = await fetch(`${baseUrl}/protected`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(protectedResponse.status, 200);
  assert.deepEqual(await protectedResponse.json(), { username: "test-admin" });
});

test("protected routes reject missing, invalid, and expired JWTs", async () => {
  const missing = await fetch(`${baseUrl}/protected`);
  assert.equal(missing.status, 401);

  const invalid = await fetch(`${baseUrl}/protected`, {
    headers: { Authorization: "Bearer invalid-token" },
  });
  assert.equal(invalid.status, 401);

  const expiredToken = jwt.sign({ sub: "test-admin" }, process.env.JWT_SECRET, { expiresIn: -1 });
  const expired = await fetch(`${baseUrl}/protected`, {
    headers: { Authorization: `Bearer ${expiredToken}` },
  });
  assert.equal(expired.status, 401);
});

test("queue management endpoints require an admin token", async () => {
  const requests = [
    fetch(`${baseUrl}/api/queue/stats`),
    fetch(`${baseUrl}/api/queue/call-next`, { method: "PATCH" }),
    fetch(`${baseUrl}/api/queue/123/done`, { method: "PATCH" }),
  ];

  const responses = await Promise.all(requests);
  assert.deepEqual(responses.map((response) => response.status), [401, 401, 401]);
});
