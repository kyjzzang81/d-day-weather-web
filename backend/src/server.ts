import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import weatherRouter from './routes/weather.js';
import contactRouter from './routes/contact.js';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 요청 로깅 미들웨어
app.use((req: Request, res: Response, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 라우트
app.use('/api/weather', weatherRouter);
app.use('/api/contact', contactRouter);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// 404 핸들러
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
  });
});

// 에러 핸들러
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Weather API: http://localhost:${PORT}/api/weather`);
  console.log(`💬 Contact API: http://localhost:${PORT}/api/contact`);
});

export default app;
