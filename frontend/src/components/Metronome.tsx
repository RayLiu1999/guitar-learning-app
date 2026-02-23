import { useMetronome } from '../hooks/useMetronome';

/**
 * Metronome — 互動式節拍器 UI 元件
 *
 * 功能：
 * - 播放/暫停切換
 * - BPM 數字輸入 (40-240)
 * - BPM 加減按鈕 (±1, ±10)
 * - 四分 / 八分音符模式切換
 * - 視覺節拍燈（4 個格子隨拍次閃爍）
 */
export function Metronome() {
  const { bpm, isPlaying, timingMode, beat, setBpm, toggle, setTimingMode } = useMetronome();

  const BEAT_DOTS = 4;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-200">🥁 節拍器</h2>
        <div className="flex gap-1">
          {Array.from({ length: BEAT_DOTS }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-75 ${
                isPlaying && beat === i
                  ? i === 0
                    ? 'bg-primary-400 scale-125 shadow-sm shadow-primary-400/80'
                    : 'bg-accent-400 scale-110'
                  : 'bg-surface-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* BPM 控制 */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <button
          onClick={() => setBpm(bpm - 10)}
          className="px-3 py-1.5 rounded-lg bg-surface-700 hover:bg-surface-600 text-gray-100 text-sm font-mono transition-colors"
        >
          -10
        </button>
        <button
          onClick={() => setBpm(bpm - 1)}
          className="px-3 py-1.5 rounded-lg bg-surface-700 hover:bg-surface-600 text-gray-100 text-sm font-mono transition-colors"
        >
          -1
        </button>

        {/* BPM 數字 + 標籤 */}
        <div className="text-center mx-2">
          <input
            type="number"
            id="metronome-bpm"
            min={40}
            max={240}
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value) || bpm)}
            className="w-20 text-center text-4xl font-bold text-primary-400 bg-transparent border-b-2 border-primary-500/30 focus:border-primary-500 focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <p className="text-xs text-gray-500 mt-1">BPM</p>
        </div>

        <button
          onClick={() => setBpm(bpm + 1)}
          className="px-3 py-1.5 rounded-lg bg-surface-700 hover:bg-surface-600 text-gray-100 text-sm font-mono transition-colors"
        >
          +1
        </button>
        <button
          onClick={() => setBpm(bpm + 10)}
          className="px-3 py-1.5 rounded-lg bg-surface-700 hover:bg-surface-600 text-gray-100 text-sm font-mono transition-colors"
        >
          +10
        </button>
      </div>

      {/* BPM 滑桿 */}
      <div className="mb-5 px-1">
        <input
          type="range"
          id="metronome-bpm-slider"
          min={40}
          max={240}
          value={bpm}
          onChange={(e) => setBpm(parseInt(e.target.value))}
          className="w-full accent-primary-500"
        />
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>40</span>
          <span className="text-gray-500">{bpm < 66 ? 'Largo' : bpm < 76 ? 'Adagio' : bpm < 108 ? 'Andante' : bpm < 120 ? 'Moderato' : bpm < 156 ? 'Allegro' : 'Presto'}</span>
          <span>240</span>
        </div>
      </div>

      {/* 音符模式切換 */}
      <div className="flex gap-2 mb-5">
        {(['quarter', 'eighth'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setTimingMode(mode)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              timingMode === mode
                ? 'bg-primary-500/20 border border-primary-500/40 text-primary-300'
                : 'bg-surface-700/50 border border-surface-600/30 text-gray-500 hover:text-gray-300'
            }`}
          >
            {mode === 'quarter' ? '♩ 四分音符' : '♪ 八分音符'}
          </button>
        ))}
      </div>

      {/* 播放按鈕 */}
      <button
        id="metronome-toggle"
        onClick={toggle}
        className={`w-full py-3 rounded-2xl font-semibold text-lg transition-all duration-200 ${
          isPlaying
            ? 'bg-gradient-to-r from-red-500/80 to-red-600/80 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-500/20'
            : 'bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-400 hover:to-accent-400 text-white shadow-lg shadow-primary-500/20'
        }`}
      >
        {isPlaying ? '⏹ 停止' : '▶ 開始'}
      </button>

      {/* 常用 BPM 快速選擇 */}
      <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
        {[60, 80, 100, 120, 140, 160].map((preset) => (
          <button
            key={preset}
            onClick={() => setBpm(preset)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
              bpm === preset
                ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                : 'text-gray-400 hover:text-gray-100 hover:bg-surface-700'
            }`}
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}
