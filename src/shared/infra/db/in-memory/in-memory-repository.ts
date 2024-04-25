import { Entity } from "../../../domain/entity";
import { NotFoundError } from "../../../domain/errors/not-found.error";
import {
  IRepository,
  ISearchableRepository,
} from "../../../domain/repository/repository-interface";
import {
  SearchParams,
  SortDirection,
} from "../../../domain/repository/search-params";
import { SearchResult } from "../../../domain/repository/search-result";
import { ValueObject } from "../../../domain/value-object";

export abstract class InMemoryRepository<
  E extends Entity,
  EntityId extends ValueObject
> implements IRepository<E, EntityId>
{
  entities: E[] = [];
  async insert(entity: E): Promise<void> {
    this.entities.push(entity);
  }
  async bulkInsert(entities: E[]): Promise<void> {
    this.entities.push(...entities);
  }

  protected getIndexOrThrow(entityId: ValueObject): number {
    const index = this.entities.findIndex((e) => e.entity_id.equals(entityId));
    if (index === -1) {
      throw new NotFoundError(entityId.toString(), this.getEntity());
    }
    return index;
  }
  async update(entity: E): Promise<void> {
    const index = this.getIndexOrThrow(entity.entity_id);
    this.entities[index] = entity;
  }
  async delete(entityId: EntityId): Promise<void> {
    const index = this.getIndexOrThrow(entityId);
    this.entities.splice(index, 1);
  }
  async findById(entityId: EntityId): Promise<E | null> {
    return this.entities.find((e) => e.entity_id.equals(entityId)) ?? null;
  }
  async findAll(): Promise<E[]> {
    return this.entities;
  }
  abstract getEntity(): new (...args: any[]) => E;
}

export abstract class InMemorySearchableRepository<
    E extends Entity,
    EntityId extends ValueObject,
    Filter = string
  >
  extends InMemoryRepository<E, EntityId>
  implements ISearchableRepository<E, EntityId, Filter>
{
  sortableFields: string[] = [];
  async search(props: SearchParams<Filter>): Promise<SearchResult<E>> {
    const filteredValues = await this.applyFilter(this.entities, props.filter);
    const sortedValues = this.applySort(
      filteredValues,
      props.sort,
      props.sort_dir
    );
    const paginatedValues = this.applyPagination(
      sortedValues,
      props.page,
      props.per_page
    );

    return new SearchResult({
      current_page: props.page,
      per_page: props.per_page,
      items: paginatedValues,
      total: filteredValues.length,
    });
  }

  protected abstract applyFilter(
    items: E[],
    filter: Filter | null
  ): Promise<E[]>;

  protected applySort(
    items: E[],
    sort: string | null,
    sort_dir: SortDirection,
    custom_getter?: (sort: string, item: E) => any
  ) {
    if (!sort || !this.sortableFields.includes(sort)) {
      return items;
    }
    return [...items].sort((a, b) => {
      // @ts-ignore
      const aValue = custom_getter ? custom_getter(sort, a) : a[sort];
      // @ts-ignore
      const bValue = custom_getter ? custom_getter(sort, b) : b[sort];
      if (aValue < bValue) {
        return sort_dir === "asc" ? -1 : 1;
      }

      if (aValue > bValue) {
        return sort_dir === "asc" ? 1 : -1;
      }

      return 0;
    });
  }

  protected applyPagination(
    items: E[],
    page: SearchParams["page"],
    perPage: SearchParams["per_page"]
  ) {
    const start = (page - 1) * perPage;
    const limit = start + perPage;
    return items.slice(start, limit);
  }
}
