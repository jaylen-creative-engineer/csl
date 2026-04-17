import type { IRepository } from "../repository.types.js";

export abstract class InMemoryRepository<TEntity extends { id: string }, TId extends string>
  implements IRepository<TEntity, TId>
{
  protected readonly store = new Map<TId, TEntity>();
  private counter = 0;

  constructor(private readonly prefix: string) {}

  save(entity: TEntity): void {
    this.store.set(entity.id as TId, entity);
  }

  findById(id: TId): TEntity | undefined {
    return this.store.get(id);
  }

  findAll(): TEntity[] {
    return Array.from(this.store.values());
  }

  nextId(): TId {
    return `${this.prefix}:${++this.counter}` as TId;
  }
}
