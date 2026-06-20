import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import yaml from "js-yaml";
import fs from "fs";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI — serve the OpenAPI spec
const specPath = path.resolve(process.cwd(), "../../lib/api-spec/openapi.yaml");
if (fs.existsSync(specPath)) {
  const spec = yaml.load(fs.readFileSync(specPath, "utf8")) as object;
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(spec, {
    customSiteTitle: "FoodFleet API Docs",
    customCss: ".swagger-ui .topbar { background: linear-gradient(135deg,#f59e0b,#d97706); }",
  }));
}

app.use("/api", router);

export default app;
