import mongoose, { Schema, Document } from 'mongoose';

export interface IAchievement extends Document {
  userId: string;
  badgeId: string;
  unlockedAt: Date;
}

const AchievementSchema = new Schema<IAchievement>({
  userId: { type: String, required: true, index: true },
  badgeId: { type: String, required: true },
  unlockedAt: { type: Date, required: true, default: Date.now },
});

// 同一使用者不能重複解鎖同一個徽章
AchievementSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

export default mongoose.model<IAchievement>('Achievement', AchievementSchema);
