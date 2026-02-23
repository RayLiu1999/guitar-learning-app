import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Fretboard } from '../Fretboard';

describe('Fretboard Component', () => {
  it('1. 預設渲染 15 格指板', () => {
    // container 取得整包 HTML，或測試特定文案
    render(<Fretboard />);
    // SVG 中應該包含 1-15 的數字標示 (15格)
    // 我們可以查特定的數字 15 是否存在於 svg 的 text 中
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('2. 傳入和弦名稱時，應顯示和弦標題', () => {
    render(<Fretboard chord="Am" />);
    const title = screen.getByText(/Am 和弦指板/);
    expect(title).toBeInTheDocument();
  });

  it('3. 傳入特定的 notes，應顯示該 notes 對應的文字', () => {
    // 第五弦第三格是 C，第四弦第二格是 E
    render(<Fretboard notes={['C', 'E']} />);
    
    // SVG 裡至少要找到 C 和 E 的圓點文字
    const cNotes = screen.getAllByText('C');
    const eNotes = screen.getAllByText('E');
    expect(cNotes.length).toBeGreaterThan(0);
    expect(eNotes.length).toBeGreaterThan(0);
  });

  it('4. 定義 frets = 5 則只渲染到第 5 格', () => {
    render(<Fretboard frets={5} />);
    
    // 應該要有 5
    expect(screen.getByText('5')).toBeInTheDocument();
    
    // 不該要有 12 或 15
    const fret12 = screen.queryByText('12');
    expect(fret12).not.toBeInTheDocument();
  });
});
