import { NativeConnection, Worker } from "@temporalio/worker";
import { URL, fileURLToPath } from "url";
import path from "path";
import * as activities from "./activities.ts";

const workflowsPathUrl = new URL(
  `./workflows${path.extname(import.meta.url)}`,
  import.meta.url,
);

const worker = await Worker.create({
  connection: await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS || "temporal:7233",
  }),
  workflowsPath: fileURLToPath(workflowsPathUrl),
  activities,
  taskQueue: "spotteur-web-capture",
});

await worker.run();
