import { CaseRepository } from "@/modules/case/case.repository";
import { ResourceRepository } from "@/modules/resource/resource.repository";
import { UserRepository } from "@/modules/user/user.repository";
import notificationModel from "../notification/notification.model";

export class DashboardService {
  private userRepo = new UserRepository();
  private caseRepo = new CaseRepository();
  private resourceRepo = new ResourceRepository();

  async getDashboardStats(userRole: string): Promise<{
    success: boolean;
    data: {
      stats: {
        totalUsers: number;
        activeCases: number;
        resourcesCount: number;
        totalCounsellor: number;
        totalClinician: number;
        totalSupervisor: number;
      };
      recentActivity: any[];
    };
    message: string;
  }> {
    const [
      totalUsers,
      activeCases,
      resourcesCount,
      totalCounsellor,
      totalClinician,
      totalSupervisor,
    ] = await Promise.all([
      this.userRepo.countDocuments({}),
      this.caseRepo.countDocuments({
        status: { $in: ["Ongoing", "In Progress"] },
      }),
      this.resourceRepo.countDocuments({}),
      this.userRepo.countDocuments({ role: "Counsellor" }),
      this.userRepo.countDocuments({ role: "Clinician" }),
      this.userRepo.countDocuments({ role: "Supervisor" }),
    ]);

    const recentActivity = await notificationModel
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("userId", "fullName email profileImage")
      .lean();

    return {
      success: true,
      data: {
        stats: {
          totalUsers,
          activeCases,
          resourcesCount,
          totalCounsellor,
          totalClinician,
          totalSupervisor,
        },
        recentActivity: recentActivity.map((activity: any) => ({
          id: activity._id,
          user: activity.userId?.fullName || "Unknown",
          userImage: activity.userId?.profileImage,
          type: activity.type,
          title: activity.title,
          description: activity.body,
          time: activity.createdAt,
          status: this.getActivityStatus(activity.type),
        })),
      },
      message: "Dashboard data retrieved successfully",
    };
  }

  private getActivityStatus(type: string): string {
    const statusMap: Record<string, string> = {
      case_created: "Added",
      case_assigned: "Completed",
      resource_created: "Updated",
      resource_deleted: "Removed",
      general: "Info",
    };
    return statusMap[type] || "Info";
  }
}
