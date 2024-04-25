import { UUIDError, Uuid } from "../uuid.vo";
import { v4 as uuidV4, validate as uuidValidate, validate } from "uuid";

describe("Uuid value object", () => {
  it("should throw an uuid error when pass a invalid uuid", () => {
    const validate = jest.spyOn(Uuid.prototype as any, "validate");
    expect(() => new Uuid("invalid uuid")).toThrow(new UUIDError());
    expect(validate).toHaveBeenCalled();
  });

  it("should create a valid uuid", () => {
    const uuid = new Uuid();
    expect(validate(uuid.id)).toBe(true);
  });

  it("should create a uuid when pass it as parameter", () => {
    const existingUuid = uuidV4();
    const uuid = new Uuid(existingUuid);
    expect(uuid.id).toBe(existingUuid);
  });
});
