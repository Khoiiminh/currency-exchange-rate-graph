import rateLimit from "express-rate-limit";
import appConfig from "../app/config/app.config.js";

export const globalRateLimit = rateLimit({
    windowMs: appConfig.rate_limit.windowMs,
    limit: appConfig.rate_limit.limit,
    message: 'You have exceeded the limit due to frequent requesting!',
    standardHeaders: true,
    legacyHeaders: false
})