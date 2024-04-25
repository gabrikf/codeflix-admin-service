import { ValueObject } from "../value-object";

class StringValueObject extends ValueObject {
  constructor(readonly value: string) {
    super();
  }
}

class ComplexValueObject extends ValueObject {
  constructor(readonly value: string, readonly value2: number) {
    super();
  }
}
describe("ValueObject Tests", () => {
  describe("isEqual", () => {
    it("should return true when values are equal", () => {
      const stringValueObject = new StringValueObject("test");
      const otherStringValueObject = new StringValueObject("test");
      expect(stringValueObject.equals(otherStringValueObject)).toBe(true);
    });

    it("should return false when values are different", () => {
      const stringValueObject = new StringValueObject("test1");
      const otherStringValueObject = new StringValueObject("test");
      expect(stringValueObject.equals(otherStringValueObject)).toBe(false);
    });

    it("should return false when class is null or undefined", () => {
      const stringValueObject = new StringValueObject("test1");
      expect(stringValueObject.equals(null as any)).toBe(false);
      expect(stringValueObject.equals(undefined as any)).toBe(false);
    });

    it("should return true when values are equal", () => {
      const complexValueObject = new ComplexValueObject("test", 1);
      const otherComplexValueObject = new ComplexValueObject("test", 1);
      expect(complexValueObject.equals(otherComplexValueObject)).toBe(true);
    });

    it("should return false when one or more attributes are different", () => {
      const complexValueObject = new ComplexValueObject("test", 2);
      const otherComplexValueObject = new ComplexValueObject("test", 1);
      expect(complexValueObject.equals(otherComplexValueObject)).toBe(false);
    });
  });
});
