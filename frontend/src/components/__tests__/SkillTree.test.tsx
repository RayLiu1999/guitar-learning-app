import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SkillTree } from '../SkillTree';
import type { ProgressItem } from '../../api';

/** 建立模擬的完整進度（completedItems 長度 = 5 代表文章完成） */
function makeProgress(articleIds: string[]): ProgressItem[] {
  return articleIds.map((articleId) => ({
    _id: `mock-${articleId}`,
    userId: 'test-user',
    articleId,
    completedItems: [0, 1, 2, 3, 4], // 5 個全打勾 = 完成
    lastUpdated: new Date().toISOString(),
  }));
}

describe('SkillTree Component', () => {
  it('1. 無進度時渲染技能樹基本結構（標題與難度圖例）', () => {
    render(<SkillTree progress={[]} />);

    // 確認標題存在
    expect(screen.getByText('🌳 技巧技能樹')).toBeInTheDocument();

    // 確認難度標籤存在（圖例）
    expect(screen.getByText('初級')).toBeInTheDocument();
    expect(screen.getByText('中級')).toBeInTheDocument();
    expect(screen.getByText('高級')).toBeInTheDocument();
    expect(screen.getByText('專題')).toBeInTheDocument();
  });

  it('2. 無進度時統計應顯示 0 個完成節點', () => {
    render(<SkillTree progress={[]} />);

    const stat = screen.getByTestId('skill-stat');
    expect(stat.textContent).toContain('0');
    expect(stat.textContent).toContain('18');
  });

  it('3. 完成 tech_01 後，統計應顯示 1 個完成節點', () => {
    const progress = makeProgress(['tech_01']);
    render(<SkillTree progress={progress} />);

    const stat = screen.getByTestId('skill-stat');
    expect(stat.textContent).toContain('1');
    expect(stat.textContent).toContain('18');
  });

  it('4. 完成 tech_01 後，tech_01 節點的 aria-label 應標示「已完成」', () => {
    const progress = makeProgress(['tech_01']);
    render(<SkillTree progress={progress} />);

    const node = screen.getByRole('img', { name: /撥弦基礎：已完成/ });
    expect(node).toBeInTheDocument();
  });

  it('5. 未完成 tech_01 時，tech_03 節點的 aria-label 應標示「尚未解鎖」', () => {
    render(<SkillTree progress={[]} />);

    const node = screen.getByRole('img', { name: /Power Chord：尚未解鎖/ });
    expect(node).toBeInTheDocument();
  });

  it('6. 完成 tech_01 時，tech_03 節點的 aria-label 應標示「可學習」', () => {
    const progress = makeProgress(['tech_01']);
    render(<SkillTree progress={progress} />);

    const node = screen.getByRole('img', { name: /Power Chord：可學習/ });
    expect(node).toBeInTheDocument();
  });
});
