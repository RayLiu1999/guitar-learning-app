import { describe, it, expect } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import Progress from '../models/Progress';
import PracticeLog from '../models/PracticeLog';

describe('Progress API Integration Tests', () => {
  const mockUserId = 'test-user-123';
  const articleA = 'tech_01';
  const articleB = 'theory_02';

  // 取得今天當地日期字串 (YYYY-MM-DD)
  const getTodayStr = () => new Date().toISOString().split('T')[0]!;

  it('1. GET /api/progress - 初始狀態為空', async () => {
    const res = await request(app).get(`/api/progress?userId=${mockUserId}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('2. POST /api/progress/toggle - 新增單一進度與自動建立今日打卡紀錄', async () => {
    const res = await request(app)
      .post('/api/progress/toggle')
      .send({ userId: mockUserId, articleId: articleA, itemIndex: 0 });

    expect(res.status).toBe(200);
    expect(res.body.progress.completedItems).toEqual([0]);

    // 驗證進度寫入 DB
    const progressInDb = await Progress.findOne({ userId: mockUserId, articleId: articleA });
    expect(progressInDb?.completedItems).toEqual([0]);

    // 驗證打卡紀錄是否連動建立
    const today = getTodayStr();
    const logInDb = await PracticeLog.findOne({ userId: mockUserId, date: today });
    expect(logInDb).toBeTruthy();
    expect(logInDb?.articles).toContain(articleA);
  });

  it('3. POST /api/progress/toggle - 切換（取消）同一個進度', async () => {
    // 先發送一次建立進度
    await request(app)
      .post('/api/progress/toggle')
      .send({ userId: mockUserId, articleId: articleA, itemIndex: 0 });

    // 再次發送相同的 payload 進行切換取消
    const res = await request(app)
      .post('/api/progress/toggle')
      .send({ userId: mockUserId, articleId: articleA, itemIndex: 0 });

    expect(res.status).toBe(200);
    expect(res.body.progress.completedItems).toEqual([]);
  });

  it('4. POST /api/progress/toggle - 同一天新增不同文章，應合併在同一筆打卡紀錄', async () => {
    await request(app).post('/api/progress/toggle').send({ userId: mockUserId, articleId: articleA, itemIndex: 1 });
    await request(app).post('/api/progress/toggle').send({ userId: mockUserId, articleId: articleB, itemIndex: 0 });

    const today = getTodayStr();
    const logs = await PracticeLog.find({ userId: mockUserId, date: today });

    expect(logs.length).toBe(1); // 只有一筆今日的紀錄
    expect(logs[0]?.articles).toContain(articleA);
    expect(logs[0]?.articles).toContain(articleB);
  });

  it('5. GET /api/progress/practice-log - 正確回傳打卡陣列', async () => {
    const today = getTodayStr();

    // 手動建立今日與昨日的打卡紀錄
    await PracticeLog.create({
      userId: mockUserId,
      date: today,
      articles: [articleA]
    });
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0]!;

    await PracticeLog.create({
      userId: mockUserId,
      date: yesterdayStr,
      articles: ['tech_old']
    });

    const res = await request(app).get(`/api/progress/practice-log?userId=${mockUserId}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    // 確認排序是新的在前
    expect(res.body[0].date).toBe(today);
    expect(res.body[1].date).toBe(yesterdayStr);
  });
});
