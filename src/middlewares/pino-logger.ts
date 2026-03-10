import dayjs from "dayjs";
import { randomUUID } from "node:crypto";
import pino from "pino";
import pinoHttp from "pino-http";
import pretty from "pino-pretty";

import { env } from "@/env";

const logger = pino(
  {
    level: env.LOG_LEVEL || "info",
    timestamp: () => `,"time":"${dayjs().format("YYYY-MM-DD HH:mm:ss")}"`,
  },
  env.NODE_ENV === "production" ? undefined : pretty()
);

function pinoLogger() {
  return pinoHttp({
    logger,
    genReqId(req, res) {
      const existingID = req.id ?? req.headers["x-request-id"];
      if (existingID) return existingID;
      const id = randomUUID();
      res.setHeader("X-Request-Id", id);
      return id;
    },
    useLevel: env.LOG_LEVEL,
  });
}

export { logger, pinoLogger };
