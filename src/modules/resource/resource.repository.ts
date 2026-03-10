import { BaseRepository } from "@/modules/base/base.repository";
import { PaginateOptions, PaginateResult, Types } from "mongoose";
import ResourceModel, { IResource } from "./resource.model";

export class ResourceRepository extends BaseRepository<IResource> {
  constructor() {
    super(ResourceModel);
  }

  async paginateResources(
    query: any = {},
    options: PaginateOptions = {}
  ): Promise<PaginateResult<IResource>> {
    return (this.model as any).paginate(query, options);
  }

  async findResourcesForUser(
    userRole: string,
    filters: any = {},
    userId?: string
  ): Promise<IResource[]> {
    const query: any = {
      visibleFor: { $in: [userRole] },
      ...filters,
    };

    // If getting bookmarked resources only
    if (filters.bookmarked === "true" && userId) {
      query.bookmarkedBy = { $in: [new Types.ObjectId(userId)] };
      delete query.bookmarked;
    }

    return this.findAll(query, {
      populate: [
        { path: "category", select: "name" },
        { path: "createdBy", select: "fullName email role" },
      ],
      sort: { createdAt: -1 },
    });
  }

  async findResourceById(resourceId: string): Promise<IResource | null> {
    const resources = await this.findAll(
      { _id: resourceId },
      {
        populate: [
          { path: "category", select: "name" },
          { path: "createdBy", select: "fullName email role" },
          { path: "bookmarkedBy", select: "fullName email role" },
        ],
      }
    );
    return resources[0] || null;
  }

  async bookmarkResource(
    resourceId: string,
    userId: string
  ): Promise<IResource | null> {
    const resource = await this.findById(resourceId);
    if (!resource) return null;

    const isBookmarked = resource.bookmarkedBy.some(
      (id) => id.toString() === userId
    );

    if (isBookmarked) return resource;

    resource.bookmarkedBy.push(new Types.ObjectId(userId) as any);
    return resource.save();
  }

  async unbookmarkResource(
    resourceId: string,
    userId: string
  ): Promise<IResource | null> {
    const resource = await this.findById(resourceId);
    if (!resource) return null;

    resource.bookmarkedBy = resource.bookmarkedBy.filter(
      (id) => id.toString() !== userId
    );
    return resource.save();
  }

  async getUserBookmarks(
    userId: string,
    userRole: string
  ): Promise<IResource[]> {
    return this.findAll(
      {
        bookmarkedBy: { $in: [new Types.ObjectId(userId)] },
        visibleFor: { $in: [userRole] },
      },
      {
        populate: [
          { path: "category", select: "name" },
          { path: "createdBy", select: "fullName email role" },
        ],
        sort: { createdAt: -1 },
      }
    );
  }
}
