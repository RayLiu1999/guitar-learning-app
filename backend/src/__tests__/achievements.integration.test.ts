import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import Progress from '../models/Progress';
import PracticeLog from '../models/PracticeLog';
import Achievement from '../models/Achievement';

describe('Achievement System Integration Tests', () => {
  const userId = 'achievement-test-user';

  /** 模擬使用者完成某文章的全部 5 個 checkpoint */
  async function completeArticle(articleId: string): Promise<void> {
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/progress/toggle')
        .send({ userId, articleId, itemIndex: i });
    }
  }

  it('1. GET /api/achievements - 初始狀態不應有任何解鎖徽章', async () => {
    const res = await request(app).get(`/api/achievements?userId=${userId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // 所有徽章皆尚未解鎖
    const unlocked = res.body.filter((b: { unlocked: boolean }) => b.unlocked);
    expect(unlocked.length).toBe(0);
  });

  it('2. 完成技巧第一篇 → 解鎖「撥弦初心者」', async () => {
    await completeArticle('tech_01_MDFf5');

    const res = await request(app).get(`/api/achievements?userId=${userId}`);
    const badge = res.body.find((b: { id: string }) => b.id === 'technique_starter');
    expect(badge).toBeDefined();
    expect(badge.unlocked).toBe(true);
  });

  it('3. 完成技巧前 5 篇 → 解鎖「初級畢業」', async () => {
    await completeArticle('tech_01_MDFf5');
    await completeArticle('tech_02_MDJf5');
    await completeArticle('tech_03_MDNfU');
    await completeArticle('tech_04_MDRfU');
    await completeArticle('tech_05_MDVf5');

    const res = await request(app).get(`/api/achievements?userId=${userId}`);
    const badge = res.body.find((b: { id: string }) => b.id === 'technique_graduate');
    expect(badge).toBeDefined();
    expect(badge.unlocked).toBe(true);
  });

  it('4. 重複觸發 toggle 不會重複解鎖徽章', async () => {
    await completeArticle('tech_01_MDFf5');
    // 再次完成同篇（toggle 回去再打一次）
    await completeArticle('tech_01_MDFf5');

    const existing = await Achievement.find({ userId, badgeId: 'technique_starter' });
    expect(existing.length).toBe(1); // 應只有一筆
  });

  it('5. Toggle 回傳中應包含 newlyUnlocked 陣列', async () => {
    const res = await request(app)
      .post('/api/progress/toggle')
      .send({ userId, articleId: 'tech_01_MDFf5', itemIndex: 0 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('progress');
    expect(res.body).toHaveProperty('newlyUnlocked');
    expect(Array.isArray(res.body.newlyUnlocked)).toBe(true);
  });

  it('6. GET /api/achievements?userId=xxx - 缺少參數時回傳 400', async () => {
    const res = await request(app).get('/api/achievements');
    expect(res.status).toBe(400);
  });
});
