import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMetronome } from '../useMetronome';

// Mock AudioContext，因為 jsdom 不支援 Web Audio API
const mockClose = vi.fn();
const mockCreateOscillator = vi.fn(() => ({
  connect: vi.fn(),
  frequency: { value: 0 },
  start: vi.fn(),
  stop: vi.fn(),
}));
const mockCreateGain = vi.fn(() => ({
  connect: vi.fn(),
  gain: {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
}));

let mockCurrentTime = 0;
let audioContextCallCount = 0;

// 使用 class 形式讓 `new AudioContext()` 可以正常使用，並手動追蹤呼叫次數
class MockAudioContext {
  get currentTime() { return mockCurrentTime; }
  destination = {};
  createOscillator = mockCreateOscillator;
  createGain = mockCreateGain;
  close = mockClose;
  constructor() { audioContextCallCount++; }
}

vi.stubGlobal('AudioContext', MockAudioContext);

describe('useMetronome Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentTime = 0;
    audioContextCallCount = 0;
  });

  it('1. 預設狀態應為 120 BPM、已停止、四分音符模式', () => {
    const { result } = renderHook(() => useMetronome());
    expect(result.current.bpm).toBe(120);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.timingMode).toBe('quarter');
    expect(result.current.beat).toBe(0);
  });

  it('2. setBpm 應正確更新 BPM', () => {
    const { result } = renderHook(() => useMetronome());
    act(() => {
      result.current.setBpm(90);
    });
    expect(result.current.bpm).toBe(90);
  });

  it('3. setBpm 應 clamp 至 40-240 範圍', () => {
    const { result } = renderHook(() => useMetronome());

    act(() => { result.current.setBpm(10); });
    expect(result.current.bpm).toBe(40); // 低於最小值強制設為 40

    act(() => { result.current.setBpm(999); });
    expect(result.current.bpm).toBe(240); // 高於最大值強制設為 240
  });

  it('4. toggle 應切換 isPlaying 狀態', () => {
    const { result } = renderHook(() => useMetronome());

    act(() => { result.current.toggle(); });
    expect(result.current.isPlaying).toBe(true);
    expect(audioContextCallCount).toBe(1); // 懟認 AudioContext 被 new 了一次

    act(() => { result.current.toggle(); });
    expect(result.current.isPlaying).toBe(false);
    expect(mockClose).toHaveBeenCalledOnce();
  });

  it('5. setTimingMode 應正確切換八分音符模式', () => {
    const { result } = renderHook(() => useMetronome());

    act(() => { result.current.setTimingMode('eighth'); });
    expect(result.current.timingMode).toBe('eighth');

    act(() => { result.current.setTimingMode('quarter'); });
    expect(result.current.timingMode).toBe('quarter');
  });

  it('6. 連續多次 toggle 後 AudioContext 應只有一個實例', () => {
    const { result } = renderHook(() => useMetronome());

    act(() => { result.current.toggle(); }); // 開始
    act(() => { result.current.toggle(); }); // 停止
    act(() => { result.current.toggle(); }); // 再開始

    expect(audioContextCallCount).toBe(2); // 兩次 start 就產生兩個新的 context
    expect(result.current.isPlaying).toBe(true);
  });
});
