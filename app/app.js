import express from "express";
import cors from 'cors';
import { globalRateLimit } from "../middleware/rate-limit.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(globalRateLimit);

/**
 * Routes
 */

export default app;