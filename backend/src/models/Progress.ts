import mongoose, { Schema, Document } from 'mongoose';

export interface IProgress extends Document {
  /** 使用者識別碼（MVP 階段使用 UUID） */
  userId: string;
  /** 文章識別碼，格式如 'tech_01', 'theory_05' */
  articleId: string;
  /** 已完成的檢查清單項目索引 */
  completedItems: number[];
  /** 最後更新時間 */
  lastUpdated: Date;
}

const ProgressSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  articleId: { type: String, required: true },
  completedItems: { type: [Number], default: [] },
  lastUpdated: { type: Date, default: Date.now },
});

// 確保每位使用者每篇文章只有一筆進度紀錄
ProgressSchema.index({ userId: 1, articleId: 1 }, { unique: true });

export default mongoose.model<IProgress>('Progress', ProgressSchema);
