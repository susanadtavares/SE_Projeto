import express from "express";
import cors from "cors";
import api from "./api/index.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));

app.use("/api", api);

export default app;
