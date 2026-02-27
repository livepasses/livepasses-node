import type { PagedParams } from './common.js';

export interface TemplateListItem {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  passCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface TemplateDetail extends TemplateListItem {
  businessFeatures?: Record<string, unknown>;
  platformSupport?: Record<string, unknown>;
  mediaConfiguration?: Record<string, unknown>;
}

export interface ListTemplatesParams extends PagedParams {
  type?: string;
  status?: string;
}

export interface CreateTemplateParams {
  name: string;
  description?: string;
  businessFeatures: Record<string, unknown>;
  requiredMedia?: string[];
}

export interface UpdateTemplateParams {
  name?: string;
  description?: string;
  businessFeatures?: Record<string, unknown>;
}
