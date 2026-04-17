import type { IRepository } from "../repository.types.js";

export abstract class InMemoryRepository<TEntity extends { id: string }, TId extends string>
  implements IRepository<TEntity, TId>
{
  protected readonly store = new Map<TId, TEntity>();
  private counter = 0;

  constructor(private readonly prefix: string) {}

  async save(entity: TEntity): Promise<void> {
    this.store.set(entity.id as TId, entity);
  }

  async findById(id: TId): Promise<TEntity | undefined> {
    return this.store.get(id);
  }

  async findAll(): Promise<TEntity[]> {
    return Array.from(this.store.values());
  }

  nextId(): TId {
    return `${this.prefix}:${++this.counter}` as TId;
  }
}
