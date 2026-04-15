import { spawn } from "node:child_process";
import net from "node:net";
import process from "node:process";

const preferredPort = 3001;

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => {
      resolve(false);
    });

    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, "0.0.0.0");
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

const port = await findPort(preferredPort);

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
