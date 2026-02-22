import express, { type Application } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import progressRoutes from './routes/progress';
import contentRoutes from './routes/content';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/guitar-learning';

// 中介軟體
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/progress', progressRoutes);
app.use('/api/content', contentRoutes);

// 健康檢查端點
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 連線 MongoDB 並啟動伺服器
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB 連線成功');
    app.listen(PORT, () => {
      console.log(`🎸 後端伺服器運行於 http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB 連線失敗:', err);
    process.exit(1);
  });

export default app;
