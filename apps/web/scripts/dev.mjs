import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const dotenv = require("dotenv");

const webDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(webDir, "../..");
const devLockPath = path.join(webDir, ".next/dev/lock");
dotenv.config({ path: path.join(repoRoot, ".env") });
dotenv.config({ path: path.join(repoRoot, ".env.local"), override: true });

const preferredPort = 3001;

function isProcessRunning(pid) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readDevLock() {
  try {
    return JSON.parse(fs.readFileSync(devLockPath, "utf8"));
  } catch {
    return null;
  }
}

function clearStaleDevLock() {
  const lock = readDevLock();

  if (!lock?.pid || isProcessRunning(lock.pid)) {
    return lock;
  }

  fs.rmSync(devLockPath, { force: true });
  return null;
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => {
      resolve(false);
    });

    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    // Let Node bind with default host to catch both IPv4/IPv6 port conflicts.
    server.listen(port);
  });
}

async function findPort(startPort) {
  for (let port = startPort; port < startPort + 20; port += 1) {
    if (await isPortFree(port)) {
      return port;
    }
  }

  throw new Error(`No free port found starting from ${startPort}`);
}

const activeLock = clearStaleDevLock();

if (activeLock?.pid && isProcessRunning(activeLock.pid)) {
  console.error(
    [
      "Another Next.js dev server is already running for this app.",
      "",
      `- Local: http://localhost:${activeLock.port ?? preferredPort}`,
      `- PID: ${activeLock.pid}`,
      "",
      `Run: kill ${activeLock.pid}`,
    ].join("\n"),
  );
  process.exit(1);
}

const port = (await isPortFree(preferredPort))
  ? preferredPort
  : await findPort(preferredPort);

if (port !== preferredPort) {
  console.log(
    `Port ${preferredPort} is busy. Starting Next.js on ${port} instead.`,
  );
}

const child = spawn("next", ["dev", "--port", String(port)], {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    PORT: String(port),
  },
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
