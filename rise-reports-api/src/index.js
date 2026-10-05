import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import tasksRoutes from './routes/tasks.js';
import proxyRiseReportsRoutes from './routes/proxy-rise-reports.js';
import proxyVolunteerRoutes from './routes/proxy-volunteer.js';
import proxySchedulingRoutes from './routes/proxy-scheduling.js';
import proxyRiseRoutes from './routes/proxy-rise.js';
import proxyCoachAcademRoutes from './routes/proxy-coach-academ.js';
import proxyVeloRoutes from './routes/proxy-velo.js';
import proxySafariBooksRoutes from './routes/proxy-safari-books.js';
import proxySjpRoutes from './routes/proxy-sjp.js';
import proxyDubaiAnalyticaRoutes from './routes/proxy-dubai-analytica.js';
import { deleteExpiredSessions } from './services/session.js';

const app = express();
const PORT = Number(process.env.PORT || 4100);

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({ success: true, service: 'rise-reports-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rise-reports', tasksRoutes);
app.use('/api/rise-reports', proxyRiseReportsRoutes);
app.use('/api/volunteer', proxyVolunteerRoutes);
app.use('/api/scheduling', proxySchedulingRoutes);
app.use('/api/rise', proxyRiseRoutes);
app.use('/api/coach-academ', proxyCoachAcademRoutes);
app.use('/api/velo', proxyVeloRoutes);
app.use('/api/safari-books', proxySafariBooksRoutes);
app.use('/api/scientific-journals', proxySjpRoutes);
app.use('/api/dubai-analytica', proxyDubaiAnalyticaRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: err instanceof Error ? err.message : 'Internal server error',
  });
});

setInterval(() => {
  deleteExpiredSessions().catch((error) => {
    console.error('Failed to clean expired sessions', error);
  });
}, 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`rise-reports-api listening on port ${PORT}`);
});
