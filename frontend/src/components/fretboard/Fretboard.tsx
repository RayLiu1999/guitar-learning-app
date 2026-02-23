import { useState, useMemo } from 'react';
import { STRINGS, getMidiNote, midiToNoteName, isNoteActive, getNotesFromChord } from './utils';

// Fretboard 設定常數
const FRET_WIDTH_START = 60; // 第 1 格寬度
const FRET_RATIO = 0.9438;   // 模擬琴格漸窄比例 (1 / (2^(1/12)))
const STRING_SPACING = 34;   // 弦距
const TOP_MARGIN = 40;
const LEFT_MARGIN = 40;      // 給調音標示的空間

interface FretboardProps {
  /** 顯示的格數，預設 12 格 */
  frets?: number;
  /** 要點亮的音符名稱陣列，例如 ['C', 'E', 'G'] */
  notes?: string[];
  /** 要點亮的和弦名稱，例如 'Am'（如果給了 chord，會覆蓋 notes） */
  chord?: string;
  /** 是否顯示格數標籤 (3, 5, 7, 9, 12 等點位)，預設 true */
  showInlays?: boolean;
}

export function Fretboard({
  frets = 15,
  notes: initialNotes = [],
  chord,
  showInlays = true,
}: FretboardProps) {
  // 基礎音符 (從 Props 傳入)
  const baseNotes = useMemo(() => chord ? getNotesFromChord(chord) : initialNotes, [chord, initialNotes]);
  
  // 使用者手動切換的音符 (存儲座標 'stringIndex-fretIdx')
  const [userToggles, setUserToggles] = useState<Set<string>>(new Set());
  
  // 計算每一格的 X 座標與寬度
  const { fretPositions, fretWidths, currentX } = useMemo(() => {
    const positions = [0];
    const widths = [20];
    let width = FRET_WIDTH_START;
    let x = 20;
    
    for (let i = 1; i <= frets; i++) {
      positions.push(x);
      widths.push(width);
      x += width;
      width *= FRET_RATIO;
    }
    return { fretPositions: positions, fretWidths: widths, currentX: x };
  }, [frets]);
  
  const totalWidth = LEFT_MARGIN + currentX;
  const totalHeight = TOP_MARGIN + (STRINGS.length - 1) * STRING_SPACING + 30;

  const inlayFrets = [3, 5, 7, 9, 15, 17, 19, 21];

  const toggleNote = (sIdx: number, fIdx: number) => {
    const key = `${sIdx}-${fIdx}`;
    const next = new Set(userToggles);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setUserToggles(next);
  };

  return (
    <div className="glass-card p-6 overflow-x-auto custom-scrollbar my-6 group/fretboard">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-xl font-bold font-heading text-neutral-800 dark:text-neutral-100 tracking-wide">
          {chord ? `🎸 ${chord} 和弦指板` : '🎸 互動指板'}
        </h3>
        <button 
          onClick={() => setUserToggles(new Set())}
          className="text-xs px-2 py-1 bg-surface-700 hover:bg-surface-600 rounded text-gray-400 hover:text-white transition-colors"
        >
          重置
        </button>
      </div>
      
      <div className="flex justify-center min-w-max">
        <svg
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          width={totalWidth}
          height={totalHeight}
          className="select-none"
        >
          {/* 指板底色 */}
          <rect
            x={LEFT_MARGIN + 20}
            y={TOP_MARGIN}
            width={currentX - 20}
            height={(STRINGS.length - 1) * STRING_SPACING}
            fill="#2d2218"
            rx={2}
          />

          {/* 上弦枕 */}
          <rect
            x={LEFT_MARGIN + 12}
            y={TOP_MARGIN - 2}
            width={8}
            height={(STRINGS.length - 1) * STRING_SPACING + 4}
            fill="#fef08a"
            rx={2}
          />

          {/* 鑲嵌點 */}
          {showInlays && fretPositions.map((x, fretIdx) => {
            if (fretIdx === 0) return null;
            const w = fretWidths[fretIdx];
            const centerX = LEFT_MARGIN + x + w / 2;
            const centerY = TOP_MARGIN + (STRINGS.length - 1) * STRING_SPACING / 2;
            if (inlayFrets.includes(fretIdx) && fretIdx <= frets) {
              return <circle key={`inlay-${fretIdx}`} cx={centerX} cy={centerY} r={6} fill="#9ca3af" opacity={0.6} />;
            }
            if (fretIdx === 12 && fretIdx <= frets) {
              return (
                <g key={`inlay-${fretIdx}`}>
                  <circle cx={centerX} cy={centerY - 15} r={5} fill="#9ca3af" opacity={0.6} />
                  <circle cx={centerX} cy={centerY + 15} r={5} fill="#9ca3af" opacity={0.6} />
                </g>
              );
            }
            return null;
          })}

          {/* 琴格線 */}
          {fretPositions.map((x, i) => i !== 0 && (
            <line
              key={`fret-${i}`}
              x1={LEFT_MARGIN + x + fretWidths[i]} y1={TOP_MARGIN}
              x2={LEFT_MARGIN + x + fretWidths[i]} y2={TOP_MARGIN + (STRINGS.length - 1) * STRING_SPACING}
              stroke="#94a3b8" strokeWidth={2}
            />
          ))}

          {/* 琴格號碼 */}
          {fretPositions.map((x, i) => i !== 0 && (
            <text
              key={`fret-num-${i}`}
              x={LEFT_MARGIN + x + fretWidths[i] / 2} y={totalHeight - 5}
              fill="#6b7280" fontSize={10} textAnchor="middle" fontFamily="monospace"
            >
              {i}
            </text>
          ))}

          {/* 琴弦與音符 */}
          {STRINGS.map((string, sIdx) => {
            const y = TOP_MARGIN + sIdx * STRING_SPACING;
            return (
              <g key={`string-${sIdx}`}>
                <line
                  x1={LEFT_MARGIN} y1={y} x2={LEFT_MARGIN + currentX} y2={y}
                  stroke="#cbd5e1" strokeWidth={1 + sIdx * 0.4}
                />
                <text x={LEFT_MARGIN - 15} y={y + 4} fill="#94a3b8" fontSize={12} fontWeight="bold" textAnchor="end">
                  {string.tuning}
                </text>

                {fretPositions.map((x, fIdx) => {
                  if (fIdx > frets) return null;
                  const midi = getMidiNote(sIdx, fIdx);
                  const noteName = midiToNoteName(midi);
                  const isBase = isNoteActive(sIdx, fIdx, baseNotes);
                  const isUser = userToggles.has(`${sIdx}-${fIdx}`);
                  const isActive = isBase || isUser;
                  
                  const cx = fIdx === 0 ? LEFT_MARGIN + 6 : LEFT_MARGIN + x + fretWidths[fIdx] / 2;

                  return (
                    <g 
                      key={`note-${sIdx}-${fIdx}`} 
                      className="cursor-pointer"
                      onClick={() => toggleNote(sIdx, fIdx)}
                    >
                      {/* 基礎碰撞區域：保持固定尺寸，防止抖動 */}
                      <circle cx={cx} cy={y} r={16} fill="transparent" />
                      
                      {isActive && (
                        <g className="transition-transform duration-200 hover:scale-110 origin-center" style={{ transformOrigin: `${cx}px ${y}px` }}>
                          <circle
                            cx={cx} cy={y} r={fIdx === 0 ? 8 : 11}
                            fill={fIdx === 0 ? 'transparent' : isUser ? '#f59e0b' : '#0ea5e9'}
                            stroke={isUser ? '#f59e0b' : '#0ea5e9'}
                            strokeWidth={2}
                          />
                          <text
                            x={cx} y={y + 3.5}
                            fill={fIdx === 0 ? (isUser ? '#f59e0b' : '#0ea5e9') : '#fff'}
                            fontSize={fIdx === 0 ? 9 : 10} fontWeight="bold" textAnchor="middle"
                            className="pointer-events-none"
                          >
                            {noteName}
                          </text>
                        </g>
                      )}

                      {/* 未啟動時的 Hover 提示 */}
                      {!isActive && (
                        <circle
                          cx={cx} cy={y} r={10}
                          fill="currentColor" className="text-white opacity-0 hover:opacity-20 transition-opacity"
                        />
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
      <p className="text-[10px] text-center text-gray-500 mt-2 opacity-0 group-hover/fretboard:opacity-100 transition-opacity">
        提示：您可以點擊指板上的任何位置來標記音符，橙色代表手動標記。
      </p>
    </div>
  );
}
