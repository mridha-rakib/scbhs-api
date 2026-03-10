import { BaseRepository } from "@/modules/base/base.repository";
import PasswordResetModel, { IPasswordReset } from "./password-reset.model";

export class PasswordResetRepository extends BaseRepository<IPasswordReset> {
  constructor() {
    super(PasswordResetModel);
  }

  async findValidResetRequest(
    email: string,
    resetCode: string
  ): Promise<IPasswordReset | null> {
    return this.model
      .findOne({
        email: email.toLowerCase(),
        resetCode,
        isUsed: false,
        expiresAt: { $gt: new Date() },
      })
      .exec();
  }

  async invalidateUserResetRequests(userId: string): Promise<void> {
    await this.model
      .updateMany({ userId, isUsed: false }, { isUsed: true })
      .exec();
  }

  async cleanupExpiredRequests(): Promise<void> {
    await this.model.deleteMany({ expiresAt: { $lt: new Date() } }).exec();
  }
}
