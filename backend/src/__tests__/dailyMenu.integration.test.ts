import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index';
import Progress from '../models/Progress';

describe('Daily Practice Menu API', () => {
  const mockUserId = 'test-daily-menu-user';

  beforeEach(async () => {
    await Progress.deleteMany({});
  });

  it('1. 應優先推薦未完成的文章 (繼續學習)', async () => {
    // 建立 0 勾與 2 勾的進度
    await Progress.create({
      userId: mockUserId,
      articleId: 'tech_01',
      completedItems: [0, 1], // < 5 (未完成)
      lastUpdated: new Date()
    });

    const res = await request(app).get(`/api/progress/daily-menu?userId=${mockUserId}`);
    expect(res.status).toBe(200);
    expect(res.body[0].articleId).toBe('tech_01');
    expect(res.body[0].reason).toBe('continue');
  });

  it('2. 應推薦完結很久的內容 (複習)', async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 8); // 8天前

    await Progress.create({
      userId: mockUserId,
      articleId: 'tech_02',
      completedItems: [0, 1, 2, 3, 4], // 5項都完成
      lastUpdated: oldDate
    });

    const res = await request(app).get(`/api/progress/daily-menu?userId=${mockUserId}`);
    expect(res.status).toBe(200);
    expect(res.body[0].articleId).toBe('tech_02');
    expect(res.body[0].reason).toBe('review');
  });

  it('3. 全新使用者應獲得預設的新內容推薦', async () => {
    const res = await request(app).get(`/api/progress/daily-menu?userId=${mockUserId}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3); // 最多 3 個
    expect(res.body[0].reason).toBe('new');
    expect(res.body[1].reason).toBe('new');
    expect(res.body[2].reason).toBe('new');
  });
});
