import { Entity } from "../../../../domain/entity";
import { SearchParams } from "../../../../domain/repository/search-params";
import { SearchResult } from "../../../../domain/repository/search-result";
import { Uuid } from "../../../../domain/value-objects/uuid.vo";
import { InMemorySearchableRepository } from "../in-memory-repository";

interface StubEntityConstructorProps extends StubEntityCreateConstructorProps {
  entity_id?: Uuid;
}
interface StubEntityCreateConstructorProps {
  name: string;
  description: string;
}

class StubEntity extends Entity {
  entity_id: Uuid;
  name: string;
  description: string;
  constructor(props: StubEntityConstructorProps) {
    super();
    this.entity_id = props.entity_id ?? new Uuid();
    this.name = props.name;
    this.description = props.description;
  }

  static create(props: StubEntityCreateConstructorProps) {
    const entity = new StubEntity(props);
    return entity;
  }

  toJSON() {
    return {
      entity_id: this.entity_id.id,
      name: this.name,
      description: this.description,
    };
  }
}

class StubSearchableRepository extends InMemorySearchableRepository<
  StubEntity,
  Uuid
> {
  sortableFields: string[] = ["name"];

  getEntity(): new (...args: any[]) => StubEntity {
    return StubEntity;
  }

  protected async applyFilter(
    items: StubEntity[],
    filter: string | null
  ): Promise<StubEntity[]> {
    if (!filter) {
      return items;
    }
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(filter.toLowerCase()) ||
        item.description.toLowerCase().includes(filter.toLowerCase())
    );
  }
}

describe("In memory searchable repository", () => {
  let repo: StubSearchableRepository;
  beforeEach(() => {
    repo = new StubSearchableRepository();
  });

  describe("applyFilter method", () => {
    it("should no filter items when filter param is null", async () => {
      const items = [
        new StubEntity({ name: "name value", description: "description test" }),
      ];
      const spyFilterMethod = jest.spyOn(items, "filter" as any);
      const itemsFiltered = await repo["applyFilter"](items, null);
      expect(itemsFiltered).toStrictEqual(items);
      expect(spyFilterMethod).not.toHaveBeenCalled();
    });

    it("should filter using a filter param", async () => {
      const items = [
        new StubEntity({ name: "test", description: "description 1" }),
        new StubEntity({ name: "TEST", description: "description 2" }),
        new StubEntity({ name: "fake", description: "3" }),
      ];

      const spyFilterMethod = jest.spyOn(items, "filter" as any);
      let itemsFiltered = await repo["applyFilter"](items, "TEST");

      expect(itemsFiltered).toStrictEqual([items[0], items[1]]);
      expect(spyFilterMethod).toHaveBeenCalledTimes(1);

      itemsFiltered = await repo["applyFilter"](items, "description");
      expect(itemsFiltered).toStrictEqual([items[0], items[1]]);
      expect(spyFilterMethod).toHaveBeenCalledTimes(2);

      itemsFiltered = await repo["applyFilter"](items, "no-filter");
      expect(itemsFiltered).toHaveLength(0);
      expect(spyFilterMethod).toHaveBeenCalledTimes(3);
    });
  });

  describe("applySort method", () => {
    it("should no sort items", async () => {
      const items = [
        new StubEntity({ name: "b", description: "description test" }),
        new StubEntity({ name: "a", description: "description test" }),
      ];

      let itemsSorted = await repo["applySort"](items, null, null);
      expect(itemsSorted).toStrictEqual(items);

      itemsSorted = await repo["applySort"](items, "description", "asc");
      expect(itemsSorted).toStrictEqual(items);
    });

    it("should sort items", async () => {
      const items = [
        new StubEntity({ name: "b", description: "description test" }),
        new StubEntity({ name: "a", description: "description test" }),
        new StubEntity({ name: "c", description: "description test" }),
      ];

      let itemsSorted = await repo["applySort"](items, "name", "asc");
      expect(itemsSorted).toStrictEqual([items[1], items[0], items[2]]);

      itemsSorted = await repo["applySort"](items, "name", "desc");
      expect(itemsSorted).toStrictEqual([items[2], items[0], items[1]]);
    });
  });

  describe("applyPaginate method", () => {
    it("should paginate items", async () => {
      const items = [
        new StubEntity({ name: "a", description: "description test" }),
        new StubEntity({ name: "b", description: "description test" }),
        new StubEntity({ name: "c", description: "description test" }),
        new StubEntity({ name: "d", description: "description test" }),
        new StubEntity({ name: "e", description: "description test" }),
      ];

      let itemsPaginated = await repo["applyPagination"](items, 1, 2);
      expect(itemsPaginated).toStrictEqual([items[0], items[1]]);

      itemsPaginated = await repo["applyPagination"](items, 2, 2);
      expect(itemsPaginated).toStrictEqual([items[2], items[3]]);

      itemsPaginated = await repo["applyPagination"](items, 3, 2);
      expect(itemsPaginated).toStrictEqual([items[4]]);

      itemsPaginated = await repo["applyPagination"](items, 4, 2);
      expect(itemsPaginated).toStrictEqual([]);
    });
  });

  describe("search", () => {
    it("should filter passing filter prop", async () => {
      const entity = StubEntity.create({
        name: "name test 1",
        description: "description test 1",
      });
      const entity2 = StubEntity.create({
        name: "name test 2",
        description: "description test 2",
      });
      await repo.bulkInsert([entity, entity2]);

      const values = await repo.search(new SearchParams({ filter: "2" }));
      expect(values).toStrictEqual(
        new SearchResult({
          items: [entity2],
          total: 1,
          current_page: 1,
          per_page: 15,
        })
      );
    });

    it("should filter passing filter for than one item", async () => {
      const entity = StubEntity.create({
        name: "name test 1",
        description: "description test 1",
      });
      const entity2 = StubEntity.create({
        name: "name test 2",
        description: "description test 2",
      });
      await repo.bulkInsert([entity, entity2]);

      const values = await repo.search(
        new SearchParams({ filter: "description" })
      );
      expect(values).toStrictEqual(
        new SearchResult({
          items: [entity, entity2],
          total: 2,
          current_page: 1,
          per_page: 15,
        })
      );
    });
  });

  describe("sort", () => {
    it("should sort by name asc", async () => {
      const entity3 = StubEntity.create({
        name: "c",
        description: "description test 1",
      });
      const entity2 = StubEntity.create({
        name: "b",
        description: "description test 2",
      });
      const entity = StubEntity.create({
        name: "a",
        description: "description test 3",
      });
      await repo.bulkInsert([entity, entity2, entity3]);

      const values = await repo.search(
        new SearchParams({ sort: "name", sort_dir: "asc" })
      );
      expect(values.items[0]).toBe(entity);
    });

    it("should sort by name desc", async () => {
      const entity3 = StubEntity.create({
        name: "c",
        description: "description test 3",
      });
      const entity2 = StubEntity.create({
        name: "b",
        description: "description test 2",
      });
      const entity = StubEntity.create({
        name: "a",
        description: "description test 1",
      });
      await repo.bulkInsert([entity, entity2, entity3]);

      const values = await repo.search(
        new SearchParams({ sort: "name", sort_dir: "desc" })
      );
      expect(values.items[0]).toBe(entity3);
    });
  });

  describe("paginate", () => {
    it("should paginate when page is 1", async () => {
      const arrange = Array.from(
        { length: 20 },
        (v, k) =>
          new StubEntity({
            name: "name" + k,
            description: "description" + k,
          })
      );
      await repo.bulkInsert(arrange);
      const values = await repo.search(
        new SearchParams({ page: 1, per_page: 10, sort: "name" })
      );
      expect(values.items).toHaveLength(10);
      expect(values.current_page).toBe(1);
      expect(values.per_page).toBe(10);
      expect(values.last_page).toBe(2);
      expect(values.total).toBe(20);
      expect(values.items[0]).toStrictEqual(arrange[0]);
    });

    it("should paginate when page is 2", async () => {
      const arrange = Array.from(
        { length: 20 },
        (v, k) =>
          new StubEntity({
            name: "name" + (k < 10 ? "0" : "") + k,
            description: "description" + (k < 10 ? "0" : "") + +k,
          })
      );
      await repo.bulkInsert(arrange);
      const values = await repo.search(
        new SearchParams({ page: 2, per_page: 10, sort: "name" })
      );

      expect(values.items).toHaveLength(10);
      expect(values.per_page).toBe(10);
      expect(values.current_page).toBe(2);
      expect(values.last_page).toBe(2);
      expect(values.total).toBe(20);
      expect(values.items[0]).toStrictEqual(arrange[10]);
    });

    it("should paginate with per_page 15 when it is not informed", async () => {
      const arrange = Array.from(
        { length: 20 },
        (v, k) =>
          new StubEntity({
            name: "name" + (k < 10 ? "0" : "") + k,
            description: "description" + (k < 10 ? "0" : "") + +k,
          })
      );
      await repo.bulkInsert(arrange);
      const values = await repo.search(
        new SearchParams({ page: 1, sort: "name" })
      );

      expect(values.items).toHaveLength(15);
      expect(values.per_page).toBe(15);
      expect(values.current_page).toBe(1);
      expect(values.last_page).toBe(2);
      expect(values.total).toBe(20);
      expect(values.items[0]).toStrictEqual(arrange[0]);
    });
  });
});
