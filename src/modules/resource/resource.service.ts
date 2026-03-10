import { ErrorCodeEnum } from "@/enums/error-code.enum";
import {
  NotFoundException,
  UnauthorizedException,
} from "@/utils/app-error.utils";
import { Types } from "mongoose";
import categoryModel from "../category/category.model";
import { CategoryRepository } from "../category/category.repository";
import { FCMService } from "../common/services/fcm.service";
import { IResource } from "./resource.model";
import { ResourceRepository } from "./resource.repository";
import {
  CreateResourceInput,
  GetResourcesInput,
  UpdateResourceInput,
} from "./resource.type";

export class ResourceService {
  private resourceRepo = new ResourceRepository();
  private categoryRepo = new CategoryRepository();
  private fcmService = new FCMService();

  async createResource(
    createData: CreateResourceInput["body"],
    createdById: string,
    userRole: string
  ): Promise<{
    success: boolean;
    data: Partial<IResource>;
    message: string;
  }> {
    // Only Admin and SuperAdmin can create resources
    if (!["Admin", "SuperAdmin"].includes(userRole)) {
      throw new UnauthorizedException(
        "Only Admin and SuperAdmin can create resources",
        ErrorCodeEnum.ACCESS_UNAUTHORIZED
      );
    }

    // Verify category exists
    const categoryExists = await this.categoryRepo.findById(
      createData.category
    );
    if (!categoryExists) {
      throw new NotFoundException(
        "Category not found",
        ErrorCodeEnum.RESOURCE_NOT_FOUND
      );
    }

    const newResource = await this.resourceRepo.create({
      ...createData,
      category: new Types.ObjectId(createData.category),
      createdBy: new Types.ObjectId(createdById),
      bookmarkedBy: [], // Initialize empty bookmarks
    } as any);

    // send notification to counsellor, clinician & supervisor
    await this.fcmService.sendToRoles(
      ["Counsellor", "Clinician", "Supervisor"],
      "New Resource Added",
      `${newResource.title} - ${newResource.location}`,
      "resource_created",
      newResource._id.toString()
    );

    return {
      success: true,
      data: {
        id: newResource.id,
        title: newResource.title,
        description: newResource.description,
        location: newResource.location,
        servicesAvailable: newResource.servicesAvailable,
        createdAt: newResource.createdAt,
      },
      message: "Resource created successfully",
    };
  }

  // async getResources(
  //   filters: GetResourcesInput["query"],
  //   userId: string,
  //   userRole: string
  // ): Promise<{
  //   success: boolean;
  //   data: Partial<IResource>[];
  //   message: string;
  // }> {
  //   // Build filter object
  //   const resourceFilters: any = {};

  //   if (filters.category) {
  //     resourceFilters.category = filters.category;
  //   }

  //   if (filters.location) {
  //     resourceFilters.location = { $regex: filters.location, $options: "i" };
  //   }

  //   if (filters.service) {
  //     resourceFilters.servicesAvailable = { $in: [filters.service] };
  //   }

  //   const resources = await this.resourceRepo.findResourcesForUser(
  //     userRole,
  //     { ...resourceFilters, bookmarked: filters.bookmarked },
  //     userId
  //   );

  //   return {
  //     success: true,
  //     data: resources.map((resource) => ({
  //       id: resource.id,
  //       title: resource.title,
  //       description: resource.description,
  //       category: resource.category,
  //       location: resource.location,
  //       servicesAvailable: resource.servicesAvailable,
  //       contactInfo: resource.contactInfo,
  //       operatingHours: resource.operatingHours,
  //       isBookmarked: resource.bookmarkedBy.some(
  //         (id) => id.toString() === userId
  //       ),
  //       createdAt: resource.createdAt,
  //     })),
  //     message: "Resources retrieved successfully",
  //   };
  // }

  async getResources(
    filters: GetResourcesInput["query"],
    userId: string,
    userRole: string
  ): Promise<{
    success: boolean;
    data: Partial<IResource>[];
    pagination: any;
    message: string;
  }> {
    const page = parseInt(filters.page || "1");
    const limit = parseInt(filters.limit || "10");

    // Build base query based on user role
    let baseQuery: any = {};

    // Admin and SuperAdmin can see all resources
    if (!["Admin", "SuperAdmin"].includes(userRole)) {
      // Other roles see only resources visible to them
      baseQuery.visibleFor = { $in: [userRole] };
    }

    // Apply filters
    if (filters.category) {
      baseQuery.category = filters.category;
    }

    // if (filters.category) {
    //   // FIXED: Find the category ObjectId by name
    //   const category = await categoryModel
    //     .findOne({
    //       name: filters.category,
    //     })
    //     .lean();

    //   if (category) {
    //     baseQuery.category = category._id;
    //   } else {
    //     // Category not found - return empty results
    //     return {
    //       success: true,
    //       data: [],
    //       pagination: {
    //         page,
    //         limit,
    //         total: 0,
    //         totalPages: 0,
    //       },
    //       message: "Category not found",
    //     };
    //   }
    // }

    if (filters.location) {
      baseQuery.location = { $regex: filters.location, $options: "i" };
    }

    if (filters.service) {
      baseQuery.servicesAvailable = { $in: [filters.service] };
    }

    // Search by title
    if (filters.search) {
      baseQuery.title = { $regex: filters.search, $options: "i" };
    }

    // Filter bookmarked resources
    if (filters.bookmarked === "true") {
      baseQuery.bookmarkedBy = { $in: [new Types.ObjectId(userId)] };
    }

    // Use pagination
    const paginateResult = await this.resourceRepo.paginateResources(
      baseQuery,
      {
        page,
        limit,
        sort: { createdAt: -1 },
        populate: [
          { path: "category", select: "name" },
          { path: "createdBy", select: "fullName email role" },
        ],
        lean: true,
      }
    );

    return {
      success: true,
      data: Array.isArray(paginateResult.data)
        ? paginateResult.data.map((resource: any) => ({
            id: resource._id,
            title: resource.title,
            description: resource.description,
            category: resource.category,
            location: resource.location,
            servicesAvailable: resource.servicesAvailable,
            contactInfo: resource.contactInfo,
            operatingHours: resource.operatingHours,
            visibleFor: resource.visibleFor,
            isBookmarked:
              resource.bookmarkedBy?.some(
                (id: any) => id.toString() === userId
              ) || false,
            createdAt: resource.createdAt,
            createdBy: resource.createdBy,
          }))
        : [],
      pagination: paginateResult.pagination,
      message: "Resources retrieved successfully",
    };
  }

  async getResourcesForThree(
    filters: GetResourcesInput["query"],
    userId: string,
    userRole: string
  ): Promise<{
    success: boolean;
    data: any;
    pagination: any;
    message: string;
  }> {
    const page = parseInt(filters.page || "1");
    const limit = parseInt(filters.limit || "10");

    // Build base query based on user role
    let baseQuery: any = {};

    // // Admin and SuperAdmin can see all resources
    // if (!["Admin", "SuperAdmin"].includes(userRole)) {
    //   // Other roles see only resources visible to them
    //   baseQuery.visibleFor = { $in: [userRole] };
    // }

    // Apply filters

    if (filters.category) {
      // FIXED: Find the category ObjectId by name
      const category = await categoryModel
        .findOne({
          // name: filters.category,
          name: { $regex: `^${filters.category}$`, $options: "i" },
        })
        .lean();

      if (category) {
        baseQuery.category = category._id;
      } else {
        // Category not found - return empty results
        return {
          success: true,
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
          message: "Category not found",
        };
      }
    }

    if (filters.location) {
      baseQuery.location = { $regex: filters.location, $options: "i" };
    }

    if (filters.service) {
      baseQuery.servicesAvailable = { $in: [filters.service] };
    }

    // Search by title
    if (filters.search) {
      baseQuery.title = { $regex: filters.search, $options: "i" };
    }

    // Filter bookmarked resources
    if (filters.bookmarked === "true") {
      baseQuery.bookmarkedBy = { $in: [new Types.ObjectId(userId)] };
    }

    // Use pagination
    // const paginateResult = await this.resourceRepo.paginateResources(
    //   baseQuery,
    //   {
    //     page,
    //     limit,
    //     sort: { createdAt: -1 },
    //     populate: [
    //       { path: "category", select: "name" },
    //       { path: "createdBy", select: "fullName email role" },
    //     ],
    //     lean: true,
    //   }
    // );

    const result = await this.resourceRepo.findAll(baseQuery, {
      sort: { createdAt: -1 },
      populate: [
        { path: "category", select: "name" },
        { path: "createdBy", select: "fullName email role" },
      ],
      lean: true,
    });

    console.log("++++++++++++++++++++++++");
    console.log(result);

    return {
      success: true,
      data: Array.isArray(result)
        ? result.map((resource: any) => ({
            id: resource._id,
            title: resource.title,
            description: resource.description,
            category: resource.category,
            location: resource.location,
            servicesAvailable: resource.servicesAvailable,
            contactInfo: resource.contactInfo,
            operatingHours: resource.operatingHours,
            visibleFor: resource.visibleFor,
            isBookmarked:
              resource.bookmarkedBy?.some(
                (id: any) => id.toString() === userId
              ) || false,
            createdAt: resource.createdAt,
            createdBy: resource.createdBy,
          }))
        : [],
      pagination: null,
      message: "Resources retrieved successfully",
    };
  }

  async getResourceById(
    resourceId: string,
    userId: string,
    userRole: string
  ): Promise<{
    success: boolean;
    data: Partial<IResource>;
    message: string;
  }> {
    const resource = await this.resourceRepo.findResourceById(resourceId);

    if (!resource) {
      throw new NotFoundException(
        "Resource not found",
        ErrorCodeEnum.RESOURCE_NOT_FOUND
      );
    }

    if (!["Admin", "SuperAdmin"].includes(userRole)) {
      if (!resource.visibleFor.includes(userRole as any)) {
        throw new UnauthorizedException(
          "You don't have access to this resource",
          ErrorCodeEnum.ACCESS_UNAUTHORIZED
        );
      }
    }

    return {
      success: true,
      data: {
        ...(typeof resource.toObject === "function"
          ? resource.toObject()
          : resource),
        isBookmarked: resource.bookmarkedBy.some(
          (id) => id.toString() === userId
        ),
      },
      message: "Resource retrieved successfully",
    };
  }

  async updateResource(
    resourceId: string,
    updateData: UpdateResourceInput["body"],
    userId: string,
    userRole: string
  ): Promise<{
    success: boolean;
    data: Partial<IResource>;
    message: string;
  }> {
    if (!["Admin", "SuperAdmin"].includes(userRole)) {
      throw new UnauthorizedException(
        "Only Admin and SuperAdmin can update resources",
        ErrorCodeEnum.ACCESS_UNAUTHORIZED
      );
    }

    const resource = await this.resourceRepo.findById(resourceId);
    if (!resource) {
      throw new NotFoundException(
        "Resource not found",
        ErrorCodeEnum.RESOURCE_NOT_FOUND
      );
    }

    const updatePayload: any = { ...updateData };

    // If category is being updated, verify it exists
    if (updateData.category) {
      const categoryExists = await this.categoryRepo.findById(
        updateData.category
      );
      if (!categoryExists) {
        throw new NotFoundException(
          "Category not found",
          ErrorCodeEnum.RESOURCE_NOT_FOUND
        );
      }
      // Convert to ObjectId
      updatePayload.category = new Types.ObjectId(updateData.category);
    }

    const updatedResource = await this.resourceRepo.updateById(
      resourceId,
      updatePayload
    );

    return {
      success: true,
      data: {
        id: updatedResource!.id,
        title: updatedResource!.title,
        description: updatedResource!.description,
        updatedAt: updatedResource!.updatedAt,
      },
      message: "Resource updated successfully",
    };
  }

  async deleteResource(
    resourceId: string,
    userId: string,
    userRole: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    // Only Admin and SuperAdmin can delete resources
    if (!["Admin", "SuperAdmin"].includes(userRole)) {
      throw new UnauthorizedException(
        "Only Admin and SuperAdmin can delete resources",
        ErrorCodeEnum.ACCESS_UNAUTHORIZED
      );
    }

    const resource = await this.resourceRepo.findById(resourceId);
    if (!resource) {
      throw new NotFoundException(
        "Resource not found",
        ErrorCodeEnum.RESOURCE_NOT_FOUND
      );
    }

    if (resource.bookmarkedBy && resource.bookmarkedBy.length > 0) {
      const bookmarkedByUserIds = resource.bookmarkedBy.map((id) =>
        id.toString()
      );
      await this.fcmService.sendToUsers(
        bookmarkedByUserIds,
        "Resource Removed",
        `A resource you bookmarked (${resource.title}) was removed by the admin.`,
        "resource_deleted",
        resource._id.toString()
      );
    }

    await this.resourceRepo.deleteById(resourceId);

    return {
      success: true,
      message: "Resource deleted successfully",
    };
  }

  async bookmarkResource(
    resourceId: string,
    userId: string,
    userRole: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const resource = await this.resourceRepo.findById(resourceId);
    if (!resource) {
      throw new NotFoundException(
        "Resource not found",
        ErrorCodeEnum.RESOURCE_NOT_FOUND
      );
    }

    // Check if user has access to this resource
    if (!resource.visibleFor.includes(userRole as any)) {
      throw new UnauthorizedException(
        "You don't have access to this resource",
        ErrorCodeEnum.ACCESS_UNAUTHORIZED
      );
    }

    await this.resourceRepo.bookmarkResource(resourceId, userId);

    return {
      success: true,
      message: "Resource bookmarked successfully",
    };
  }

  async unbookmarkResource(
    resourceId: string,
    userId: string,
    userRole: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const resource = await this.resourceRepo.findById(resourceId);
    if (!resource) {
      throw new NotFoundException(
        "Resource not found",
        ErrorCodeEnum.RESOURCE_NOT_FOUND
      );
    }

    await this.resourceRepo.unbookmarkResource(resourceId, userId);

    return {
      success: true,
      message: "Resource unbookmarked successfully",
    };
  }

  async toggleBookmarkResource(
    resourceId: string,
    userId: string,
    userRole: string
  ): Promise<{
    success: boolean;
    isBookmarked: boolean;
    message: string;
  }> {
    const resource = await this.resourceRepo.findById(resourceId);
    if (!resource) {
      throw new NotFoundException(
        "Resource not found",
        ErrorCodeEnum.RESOURCE_NOT_FOUND
      );
    }

    if (!resource.visibleFor.includes(userRole as any)) {
      throw new UnauthorizedException(
        "You don't have access to this resource",
        ErrorCodeEnum.ACCESS_UNAUTHORIZED
      );
    }

    const isCurrentlyBookmarked = resource.bookmarkedBy.some(
      (id) => id.toString() === userId
    );

    if (isCurrentlyBookmarked) {
      // Remove bookmark
      await this.resourceRepo.unbookmarkResource(resourceId, userId);
      return {
        success: true,
        isBookmarked: false,
        message: "Resource debookmarked successfully",
      };
    } else {
      // Add bookmark
      await this.resourceRepo.bookmarkResource(resourceId, userId);
      return {
        success: true,
        isBookmarked: true,
        message: "Resource bookmarked successfully",
      };
    }
  }

  async getUserBookmarks(
    userId: string,
    userRole: string
  ): Promise<{
    success: boolean;
    data: Partial<IResource>[];
    message: string;
  }> {
    const bookmarks = await this.resourceRepo.getUserBookmarks(
      userId,
      userRole
    );

    return {
      success: true,
      data: bookmarks.map((resource) => ({
        id: resource._id,
        title: resource.title,
        description: resource.description,
        category: resource.category,
        location: resource.location,
        servicesAvailable: resource.servicesAvailable,
        contactInfo: resource.contactInfo,
        operatingHours: resource.operatingHours,
        isBookmarked: true, // All are bookmarked in this context
        createdAt: resource.createdAt,
      })),
      message: "Bookmarked resources retrieved successfully",
    };
  }

  async getAllResourceLocations(): Promise<string[]> {
    const resources = await this.resourceRepo.findAll(
      {},
      { select: "location" }
    );

    const locations = resources.map((resource) => resource.location);

    const uniqueLocations = Array.from(new Set(locations));
    return uniqueLocations;
  }
}
