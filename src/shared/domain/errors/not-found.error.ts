import { Entity } from "../entity";

export class NotFoundError extends Error {
  constructor(id: string | [], entity: new (...args: any) => Entity) {
    const ids = Array.isArray(id) ? id.join(", ") : id;
    super(`Entity ${entity.name} Not found using id ${ids}`);
    this.name = "NotFoundError";
  }
}
