import type { HttpClient } from '../http.js';
import type { ApiPagedResponse } from '../types/common.js';
import type {
  TemplateListItem,
  TemplateDetail,
  ListTemplatesParams,
  CreateTemplateParams,
  UpdateTemplateParams,
} from '../types/templates.js';

export class TemplatesResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List templates (paginated).
   */
  async list(params?: ListTemplatesParams): Promise<ApiPagedResponse<TemplateListItem>> {
    return this.http.getPaged<TemplateListItem>('/api/templates', params as Record<string, string | number | boolean | undefined>);
  }

  /**
   * Get a single template by ID.
   */
  async get(templateId: string): Promise<TemplateDetail> {
    return this.http.get<TemplateDetail>(`/api/templates/${templateId}`);
  }

  /**
   * Create a new template.
   */
  async create(params: CreateTemplateParams): Promise<TemplateDetail> {
    return this.http.post<TemplateDetail>('/api/templates', params);
  }

  /**
   * Update a template.
   */
  async update(templateId: string, params: UpdateTemplateParams): Promise<TemplateDetail> {
    return this.http.put<TemplateDetail>(`/api/templates/${templateId}`, params);
  }

  /**
   * Activate a template for pass generation.
   */
  async activate(templateId: string): Promise<void> {
    await this.http.post<unknown>(`/api/templates/${templateId}/activate`);
  }

  /**
   * Deactivate a template.
   */
  async deactivate(templateId: string): Promise<void> {
    await this.http.post<unknown>(`/api/templates/${templateId}/deactivate`);
  }
}
