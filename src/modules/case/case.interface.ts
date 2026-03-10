import { ICase } from "./case.model";

export interface CaseResponse {
  success: boolean;
  data: Partial<ICase>;
  message?: string;
}

export interface CaseListResponse {
  success: boolean;
  data: Partial<ICase>[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  message: string;
}

export interface ApplicationResponse {
  success: boolean;
  data: {
    case: Partial<ICase>;
    newStatus: string;
  };
  message: string;
}
