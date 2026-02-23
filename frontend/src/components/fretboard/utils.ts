/**
 * Fretboard 輔助計算函數與常數
 */

export const STRINGS = [
  { tuning: 'E', num: 1, baseMidi: 64 }, // E4
  { tuning: 'B', num: 2, baseMidi: 59 }, // B3
  { tuning: 'G', num: 3, baseMidi: 55 }, // G3
  { tuning: 'D', num: 4, baseMidi: 50 }, // D3
  { tuning: 'A', num: 5, baseMidi: 45 }, // A2
  { tuning: 'E', num: 6, baseMidi: 40 }, // E2
];

export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** 
 * 將 MIDI Note Number 轉換為音符名稱 (不包含八度)
 */
export function midiToNoteName(midi: number): string {
  return NOTES[midi % 12];
}

/**
 * 取得指定弦、指定格數的 MIDI Number
 */
export function getMidiNote(stringIdx: number, fret: number): number {
  return STRINGS[stringIdx].baseMidi + fret;
}

/**
 * 傳入一個基準陣列，比對是否為異名同音（例如 Db 等於 C#）
 * 簡單處理：將所有的 b 轉為降半音的 #
 */
function normalizeNote(note: string): string {
  if (note.length === 1) return note;
  const flatToSharp: Record<string, string> = {
    'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
  };
  return flatToSharp[note] || note;
}

/**
 * 判斷該指板位置是否在要顯示的 notes 陣列中
 */
export function isNoteActive(stringIdx: number, fret: number, targetNotes: string[]): boolean {
  if (!targetNotes || targetNotes.length === 0) return false;

  const midi = getMidiNote(stringIdx, fret);
  const noteName = midiToNoteName(midi);

  const normalizedTargets = targetNotes.map(normalizeNote);
  return normalizedTargets.includes(noteName);
}

/**
 * 給定和弦名稱，回傳對應的組成音（簡化版）
 * 實際應用可引入 tonaljs 來處理複雜和弦
 */
export function getNotesFromChord(chord: string): string[] {
  // 這裡先簡單 mapping 常見的基礎和弦，實際可擴充或用套件
  const chordMap: Record<string, string[]> = {
    'C': ['C', 'E', 'G'],
    'D': ['D', 'F#', 'A'],
    'E': ['E', 'G#', 'B'],
    'F': ['F', 'A', 'C'],
    'G': ['G', 'B', 'D'],
    'A': ['A', 'C#', 'E'],
    'B': ['B', 'D#', 'F#'],
    'Cm': ['C', 'D#', 'G'], // Eb -> D#
    'Dm': ['D', 'F', 'A'],
    'Em': ['E', 'G', 'B'],
    'Fm': ['F', 'G#', 'C'], // Ab -> G#
    'Gm': ['G', 'A#', 'D'], // Bb -> A#
    'Am': ['A', 'C', 'E'],
    'Bm': ['B', 'D', 'F#'],
  };
  return chordMap[chord] || [];
}
