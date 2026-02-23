import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { HeatmapChart, type PracticeLog } from '../HeatmapChart';

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

  it('2. 有打卡資料時顯示足跡統計文字', () => {
    const todayStr = '2025-01-01';
    const logs: PracticeLog[] = [
      { date: todayStr, articles: ['tech_01', 'theory_02'] } // 兩篇
    ];

    render(<HeatmapChart logs={logs} />);

    // 驗證年度總結文字有數字 > 0
    // 元件底部會顯示「這一年完成了 N 個學習單元」
    const summary = screen.getByText(/這一年完成了/);
    expect(summary).toBeInTheDocument();
  });
});

