import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getPool } from './db/pool.js';
import { connectionRouter } from './routes/connection.routes.js';
import { agentRoutes } from './routes/agent.routes.js';
import { mountMcpServer } from "./mcp/mount.js";


const app = express();
const port = Number(process.env.PORT) || 4000;
const appOrigin = process.env.APP_ORIGIN ?? 'http://localhost:3000';

app.use(cors({ 
    origin: appOrigin,
    credentials: true
 })
);

app.use(express.json());

app.get('/health', async (req, res) => {
    try {
        await getPool().query('SELECT 1'); // Simple query to check database connection
        res.json({status: 'ok', service: "agentic-calendar-app", database: 'up'});
    } catch {
        res.status(503).json({ 
            status: 'error',
            service: "agentic-calendar-app",
            database: 'down',
            message: 'Internal server error',
        });
    }
});

app.use("/api/connections", connectionRouter);
app.use("/api/agent", agentRoutes);

mountMcpServer(app);

app.listen(port, () => {
    console.log(`Agentic Calendar is running on port: ${port}`);
});


