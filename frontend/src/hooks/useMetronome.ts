import { useState, useEffect, useRef, useCallback } from 'react';

const MIN_BPM = 40;
const MAX_BPM = 240;

export type TimingMode = 'quarter' | 'eighth';

export interface UseMetronomeReturn {
  bpm: number;
  isPlaying: boolean;
  timingMode: TimingMode;
  beat: number;         // 目前拍次（0-indexed），用於 UI 視覺閃爍
  setBpm: (bpm: number) => void;
  toggle: () => void;
  setTimingMode: (mode: TimingMode) => void;
}

/**
 * useMetronome — Web Audio API 節拍器核心邏輯 Hook
 *
 * 架構說明：
 * - AudioContext.currentTime 作為高精度時間基準
 * - lookahead 機制：每次排程未來 25ms 的音符，避免主執行緒 GC 造成掉拍
 * - scheduler 定義在 start closure 內，使用 ref 傳遞 BPM 與 timingMode 確保取最新值
 */
export function useMetronome(): UseMetronomeReturn {
  const [bpm, setBpmState] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timingMode, setTimingModeState] = useState<TimingMode>('quarter');
  const [beat, setBeat] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextBeatTimeRef = useRef(0);
  const beatCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPlayingRef = useRef(false);
  const bpmRef = useRef(bpm);
  const timingModeRef = useRef(timingMode);

  // 同步 ref 以讓 setTimeout callback 始終能取到最新值
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { timingModeRef.current = timingMode; }, [timingMode]);

  /** 產生一個短暫的 beep 聲（使用 OscillatorNode） */
  const scheduleBeep = useCallback((audioCtx: AudioContext, when: number, isAccent: boolean) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.frequency.value = isAccent ? 880 : 660; // 重拍 880Hz，普通拍 660Hz
    gain.gain.setValueAtTime(isAccent ? 0.8 : 0.5, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.05);

    osc.start(when);
    osc.stop(when + 0.05);
  }, []);

  /** 停止節拍器 */
  const stop = useCallback(() => {
    isPlayingRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    setBeat(0);
    setIsPlaying(false);
  }, []);

  /** 開始節拍器（scheduler 定義在此 closure 內以避免 hook 依賴問題） */
  const start = useCallback(() => {
    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;
    isPlayingRef.current = true;
    beatCountRef.current = 0;
    nextBeatTimeRef.current = audioCtx.currentTime + 0.1; // 第一拍 0.1s 後
    setIsPlaying(true);

    /**
     * scheduler — 排程下一個節拍（lookahead 25ms）
     * 使用遞迴 setTimeout 替代 setInterval，精準度更高
     */
    function scheduler() {
      const ctx = audioCtxRef.current;
      if (!ctx || !isPlayingRef.current) return;

      const lookahead = 0.025; // 25ms lookahead
      const interval = 60.0 / bpmRef.current / (timingModeRef.current === 'eighth' ? 2 : 1);

      while (nextBeatTimeRef.current < ctx.currentTime + lookahead) {
        const isAccent = beatCountRef.current === 0;
        scheduleBeep(ctx, nextBeatTimeRef.current, isAccent);

        // 更新 beat UI 狀態（非精準，僅供視覺閃爍使用）
        const capturedBeat = beatCountRef.current;
        const delay = Math.max(0, (nextBeatTimeRef.current - ctx.currentTime) * 1000);
        setTimeout(() => setBeat(capturedBeat % 4), delay);

        beatCountRef.current = (beatCountRef.current + 1) % 4;
        nextBeatTimeRef.current += interval;
      }

      timerRef.current = setTimeout(scheduler, 10); // 每 10ms 重新排程
    }

    scheduler();
  }, [scheduleBeep]);

  /** 切換播放/暫停 */
  const toggle = useCallback(() => {
    if (isPlayingRef.current) {
      stop();
    } else {
      start();
    }
  }, [start, stop]);

  const setBpm = useCallback((newBpm: number) => {
    const clamped = Math.max(MIN_BPM, Math.min(MAX_BPM, newBpm));
    setBpmState(clamped);
  }, []);

  const setTimingMode = useCallback((mode: TimingMode) => {
    setTimingModeState(mode);
  }, []);

  // 元件卸載時確保停止
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      audioCtxRef.current?.close();
    };
  }, []);

  return { bpm, isPlaying, timingMode, beat, setBpm, toggle, setTimingMode };
}
