export abstract class BaseService<TRepository, TModel> {
  constructor(protected readonly repository: TRepository) {}
}
