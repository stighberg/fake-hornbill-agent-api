import { Hono } from 'hono';
import { registerHornbillRoutes } from './hornbill/routes/registerHornbillRoutes';

const app = new Hono();

registerHornbillRoutes(app);

export default app;
