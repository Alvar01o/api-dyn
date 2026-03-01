import express from 'express';
import dotenv from 'dotenv';
import schemaRoutes from './api/routes/schema.routes';
import { errorHandler } from './api/middlewares/error.middleware';

dotenv.config();

const app = express();
app.use(express.json());

app.use(schemaRoutes);

// Debe ir al final
app.use(errorHandler);

export default app;