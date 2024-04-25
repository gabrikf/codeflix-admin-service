import { Entity } from "../../../../domain/entity";
import { NotFoundError } from "../../../../domain/errors/not-found.error";
import { Uuid } from "../../../../domain/value-objects/uuid.vo";
import { InMemoryRepository } from "../in-memory-repository";

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
    (this.name = props.name), (this.description = props.description);
  }
  toJSON() {
    return {
      entity_id: this.entity_id.id,
      name: this.name,
      description: this.description,
    };
  }
  static create(props: StubEntityCreateConstructorProps) {
    const entity = new StubEntity(props);
    return entity;
  }
  changeName(name: string) {
    this.name = name;
  }
}

class StubRepositoryInMemory extends InMemoryRepository<StubEntity, Uuid> {
  getEntity(): new (...args: any[]) => StubEntity {
    return StubEntity;
  }
}

describe("in-memory-repository", () => {
  let repo: StubRepositoryInMemory;

  beforeEach(() => {
    repo = new StubRepositoryInMemory();
  });

  it("should insert a new entity", async () => {
    const entity = StubEntity.create({
      name: "test",
      description: "test description",
    });
    await repo.insert(entity);
    expect(repo.entities).toHaveLength(1);
    expect(repo.entities[0]).toBe(entity);
    expect(repo.entities[0].entity_id.equals(entity.entity_id)).toBe(true);
  });

  it("should bulk inset entities", async () => {
    const entity = StubEntity.create({
      name: "test",
      description: "test description",
    });
    const entity2 = StubEntity.create({
      name: "test2",
      description: "test description2",
    });
    await repo.bulkInsert([entity, entity2]);
    expect(repo.entities).toHaveLength(2);
  });

  it("should update a entity", async () => {
    const entity = StubEntity.create({
      name: "test",
      description: "test description",
    });
    await repo.insert(entity);
    const newName = "newName";
    entity.changeName(newName);
    await repo.update(entity);
    expect(repo.entities[0].name).toBe(newName);
  });

  it("should delete a entity", async () => {
    const entity = StubEntity.create({
      name: "test",
      description: "test description",
    });
    await repo.insert(entity);
    await repo.delete(entity.entity_id);
    expect(repo.entities).toHaveLength(0);
  });

  it("should find a entity by id", async () => {
    const entity = StubEntity.create({
      name: "test",
      description: "test description",
    });
    await repo.insert(entity);
    const valueById = await repo.findById(entity.entity_id);
    expect(valueById).toBe(entity);
  });

  it("should find all entities", async () => {
    const entity = StubEntity.create({
      name: "test",
      description: "test description",
    });
    const entity2 = StubEntity.create({
      name: "test2",
      description: "test description2",
    });
    await repo.bulkInsert([entity, entity2]);
    const all = await repo.findAll();
    expect(all).toHaveLength(repo.entities.length);
  });

  it("should throw NotFoundError when updating a non existent entity", async () => {
    const entity = StubEntity.create({
      name: "test",
      description: "test description",
    });
    await expect(async () => await repo.update(entity)).rejects.toThrow(
      new NotFoundError(entity.entity_id.id, StubEntity)
    );
  });

  it("should throw NotFoundError when deleting a non existent entity", async () => {
    const wrong_id = new Uuid();
    await expect(async () => await repo.delete(wrong_id)).rejects.toThrow(
      new NotFoundError(wrong_id.id, StubEntity)
    );
  });

  it("should return null when not found a entity by id", async () => {
    const valueById = await repo.findById(new Uuid());
    expect(valueById).toBeNull();
  });
});
