import { apiClient } from "../core/ApiClient";

export abstract class BaseRepository<TModel> {
  constructor(protected readonly basePath: string) {}

  abstract list(token: string): Promise<TModel[]>;
  abstract get(token: string, id: string | number): Promise<TModel>;
  abstract create(token: string, data: Partial<TModel>): Promise<TModel>;
  abstract update(token: string, id: string | number, data: Partial<TModel>): Promise<TModel>;
  abstract delete(token: string, id: string | number): Promise<void>;

  protected get client() {
    return apiClient;
  }
}
