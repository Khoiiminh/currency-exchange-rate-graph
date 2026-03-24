import "./env.config.js";

const appConfig = {
    port: process.env.PORT,
    base_URL: `http://localhost:${process.env.PORT}`,

    rate_limit: {
        windowMs: 15 * 60 * 1000,
        limit: 100,
    }
}

export default appConfig;