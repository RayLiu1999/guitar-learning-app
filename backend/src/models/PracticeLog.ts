import mongoose, { Schema, Document } from 'mongoose';

export interface IPracticeLog extends Document {
  /** 使用者識別碼 */
  userId: string;
  /** 練習日期（僅日期部分，用於打卡紀錄） */
  date: string;
  /** 該日更新的文章 ID 列表 */
  articles: string[];
}

const PracticeLogSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  date: { type: String, required: true },
  articles: { type: [String], default: [] },
});

// 確保每位使用者每天只有一筆打卡紀錄
PracticeLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model<IPracticeLog>('PracticeLog', PracticeLogSchema);
