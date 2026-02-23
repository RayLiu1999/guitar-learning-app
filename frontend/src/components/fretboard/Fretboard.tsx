import { STRINGS, getMidiNote, midiToNoteName, isNoteActive, getNotesFromChord } from './utils';

// Fretboard 設定常數
const FRET_WIDTH_START = 60; // 第 1 格寬度
const FRET_RATIO = 0.9438;   // 模擬琴格漸窄比例 (1 / (2^(1/12)))
const STRING_SPACING = 30;   // 弦距
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
  notes = [],
  chord,
  showInlays = true,
}: FretboardProps) {
  const targetNotes = chord ? getNotesFromChord(chord) : notes;

  // 計算每一格的 X 座標與寬度
  const fretPositions = [0]; // 第 0 格 (空弦) 在 x=0
  const fretWidths = [20];   // 空弦標示區的寬度
  
  let currentWidth = FRET_WIDTH_START;
  let currentX = 20;
  
  for (let i = 1; i <= frets; i++) {
    fretPositions.push(currentX);
    fretWidths.push(currentWidth);
    currentX += currentWidth;
    currentWidth *= FRET_RATIO;
  }
  
  const totalWidth = LEFT_MARGIN + currentX;
  const totalHeight = TOP_MARGIN + (STRINGS.length - 1) * STRING_SPACING + 20;

  // 琴頸鑲嵌點 (Inlays) 通常在 3, 5, 7, 9, 15, 17...，12 格是雙點
  const inlayFrets = [3, 5, 7, 9, 15, 17, 19, 21];
  
  return (
    <div className="glass-card p-6 overflow-x-auto custom-scrollbar my-6">
      {chord && (
        <h3 className="text-xl font-bold font-heading text-neutral-800 dark:text-neutral-100 mb-4 tracking-wide text-center">
          🎸 {chord} 和弦指板
        </h3>
      )}
      
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
            fill="#2d2218" // 木頭深色
            rx={2}
          />

          {/* 上弦枕 (Nut) */}
          <rect
            x={LEFT_MARGIN + 12}
            y={TOP_MARGIN - 2}
            width={8}
            height={(STRINGS.length - 1) * STRING_SPACING + 4}
            fill="#fef08a" // 象牙黃色
            rx={2}
          />

          {/* 琴格鑲嵌點 (Inlays) */}
          {showInlays && fretPositions.map((x, fretIdx) => {
            if (fretIdx === 0) return null;
            const w = fretWidths[fretIdx];
            const centerX = LEFT_MARGIN + x + w / 2;
            const centerY = TOP_MARGIN + (STRINGS.length - 1) * STRING_SPACING / 2;
            
            if (inlayFrets.includes(fretIdx) && fretIdx <= frets) {
              return <circle key={`inlay-${fretIdx}`} cx={centerX} cy={centerY} r={6} fill="#9ca3af" opacity={0.6} />;
            }
            if (fretIdx === 12 && fretIdx <= frets) { // 12 格雙點
              return (
                <g key={`inlay-${fretIdx}`}>
                  <circle cx={centerX} cy={centerY - 15} r={5} fill="#9ca3af" opacity={0.6} />
                  <circle cx={centerX} cy={centerY + 15} r={5} fill="#9ca3af" opacity={0.6} />
                </g>
              );
            }
            return null;
          })}

          {/* 琴衍 (Frets) */}
          {fretPositions.map((x, i) => {
            if (i === 0) return null; // 0 是空弦區，沒有 fret wire
            return (
              <line
                key={`fret-${i}`}
                x1={LEFT_MARGIN + x + fretWidths[i]}
                y1={TOP_MARGIN}
                x2={LEFT_MARGIN + x + fretWidths[i]}
                y2={TOP_MARGIN + (STRINGS.length - 1) * STRING_SPACING}
                stroke="#94a3b8" // 金屬色
                strokeWidth={2}
              />
            );
          })}

          {/* 琴格號碼數字標示（下方） */}
          {fretPositions.map((x, i) => {
            if (i === 0) return null;
            const w = fretWidths[i];
            return (
              <text
                key={`fret-num-${i}`}
                x={LEFT_MARGIN + x + w / 2}
                y={totalHeight - 2}
                fill="#6b7280"
                fontSize={10}
                textAnchor="middle"
                fontFamily="ui-monospace, SFMono-Regular, monospace"
              >
                {i}
              </text>
            );
          })}

          {/* 吉他弦 (Strings) - 從第 1 弦 (高音 E) 畫到第 6 弦 (低音 E) */}
          {STRINGS.map((string, sIdx) => {
            // 注意：Canvas/SVG 原點在左上，所以 Y 座標越大越靠下方
            // 第 1 弦 (高音，最細) 通常在實體吉他最下面，但在譜面或指板圖上通常畫在最上面
            // 這裡採取 standard tab 視角：第 1 弦在最上面
            const y = TOP_MARGIN + sIdx * STRING_SPACING;
            const thickness = 1 + (sIdx * 0.4); // 第 6 弦最粗
            
            return (
              <g key={`string-${sIdx}`}>
                {/* 弦的線條 */}
                <line
                  x1={LEFT_MARGIN}
                  y1={y}
                  x2={LEFT_MARGIN + currentX}
                  y2={y}
                  stroke="#cbd5e1"
                  strokeWidth={thickness}
                />
                
                {/* 左側調音標示 (例如 E, B, G) */}
                <text
                  x={LEFT_MARGIN - 15}
                  y={y + 4}
                  fill="#94a3b8"
                  fontSize={12}
                  fontWeight="bold"
                  textAnchor="end"
                >
                  {string.tuning}
                </text>

                {/* 音符圓點 */}
                {fretPositions.map((x, fretIdx) => {
                  if (fretIdx > frets) return null;
                  
                  const isActive = isNoteActive(sIdx, fretIdx, targetNotes);
                  const noteName = midiToNoteName(getMidiNote(sIdx, fretIdx));
                  
                  // 空弦的圓點畫在 Nut 左邊一點
                  const cx = fretIdx === 0 ? LEFT_MARGIN + 6 : LEFT_MARGIN + x + fretWidths[fretIdx] / 2;
                  
                  // 如果沒有點亮，就不顯示（可選：是否要顯示隱藏的底色圓點供 hover 用）
                  if (!isActive) return null;

                  return (
                    <g key={`note-${sIdx}-${fretIdx}`}>
                      <circle
                        cx={cx}
                        cy={y}
                        r={fretIdx === 0 ? 8 : 10}
                        fill={fretIdx === 0 ? 'transparent' : '#0ea5e9'} // 空弦只顯示外圈
                        stroke="#0ea5e9"
                        strokeWidth={2}
                      />
                      <text
                        x={cx}
                        y={y + 3}
                        fill={fretIdx === 0 ? '#0ea5e9' : '#fff'}
                        fontSize={fretIdx === 0 ? 9 : 10}
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {noteName}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
