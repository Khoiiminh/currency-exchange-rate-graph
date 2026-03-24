import './config/env.config.js';
import http from 'node:http';
import appConfig from './config/app.config.js';
import app from './app.js';

const PORT = appConfig.port;

const server = http.createServer(app);

async function startServer() {
    try {
        server.listen(PORT, (request, response) => {
            console.log(`Server running on: ${PORT}`);
            console.log(`${appConfig.base_URL}`);
        })
    } catch (error) {
        console.error('Failed to start server', error);
        process.exit(1);
    }
}

startServer();

// Internally killed with Ctrl + C
process.on('SIGINT', () => {
    shutdown('SIGINT')
});

// Externally killed by process manager ( Docker, Kubernetes )
process.on('SIGTERM', () => {
    shutdown('SIGTERM')
});