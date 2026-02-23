import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { HeatmapChart, type PracticeLog } from '../HeatmapChart';
import { format } from 'date-fns';

const MOCK_TIME = new Date('2025-01-01T12:00:00');

describe('HeatmapChart Component', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_TIME);
  });

  afterAll(() => {
    vi.useRealTimers();
  });
  it('1. 正確渲染無資料時的預設年度網格', () => {
    // 給予空陣列
    const logs: PracticeLog[] = [];
    
    // 渲染元件
    render(<HeatmapChart logs={logs} />);
    
    // 確認標題存在
    expect(screen.getByText('🎸 練習足跡')).toBeInTheDocument();
    
    // 確認套件的月份標籤有被渲染
    expect(screen.getByText('一月')).toBeInTheDocument();
  });

  it('2. 根據傳入的打卡資料渲染不同的完成度 tooltip', () => {
    const todayStr = format(MOCK_TIME, 'yyyy-MM-dd');
    const logs: PracticeLog[] = [
      { date: todayStr, articles: ['tech_01', 'theory_02'] } // 練習了兩篇
    ];

    render(<HeatmapChart logs={logs} />);
    
    // activity-calendar 每個區塊都有 title，我們測試傳入的資料是否正確對應到 title
    const block = screen.getByTitle(`${todayStr}: 練習了 2 個單元`);
    expect(block).toBeInTheDocument();
  });
});
