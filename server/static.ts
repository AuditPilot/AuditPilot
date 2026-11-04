import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { ENV } from "./config/env";
import { logger } from "./config/logger";

export function serveStatic(app: Express) {
  if (!ENV.SERVE_STATIC) {
    logger.info(
      "SERVE_STATIC disabled — API-only deployment, SPA is served elsewhere",
    );
    return;
  }

  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("/{*path}", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
