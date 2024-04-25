import { Uuid } from "../../../shared/domain/value-objects/uuid.vo";
import { Category } from "../category.entity";

describe("Category Entity", () => {
  let validateSpy: any;
  beforeEach(() => {
    validateSpy = jest.spyOn(Category, "validate");
  });
  describe("Constructor", () => {
    it("should create a category given the name", () => {
      const category = new Category({
        name: "Drama",
      });
      expect(category.name).toBe("Drama");
      expect(category.is_active).toBeTruthy();
      expect(category.description).toBeNull();
      expect(category.created_at).toBeInstanceOf(Date);
      expect(category.category_id).toBeInstanceOf(Uuid);
    });
    it("should create a category given all the attributes", () => {
      const date = new Date();
      const id = new Uuid();
      const description = "Drama interesting movies";
      const category = new Category({
        category_id: id,
        name: "Drama",
        created_at: date,
        description: description,
        is_active: false,
      });
      expect(category.name).toBe("Drama");
      expect(category.is_active).toBeFalsy();
      expect(category.description).toBe(description);
      expect(category.created_at).toBe(date);
      expect(category.category_id).toBe(id);
    });
  });

  describe("Category_id", () => {
    const arrange = [
      { category_id: null },
      { category_id: undefined },
      { category_id: new Uuid() },
    ];
    it.each(arrange)("id = %j", ({ category_id }) => {
      const category = new Category({
        name: "Movie",
        category_id: category_id as any,
      });
      expect(category.category_id).toBeInstanceOf(Uuid);
    });
  });

  describe("Methods", () => {
    it("should change name", () => {
      const category = Category.create({
        name: "Drama",
      });
      category.changeNames("Fiction");
      expect(category.name).toBe("Fiction");
      expect(validateSpy).toHaveBeenCalledTimes(2);
    });

    it("should change description", () => {
      const category = Category.create({
        name: "Drama",
      });
      category.changeDescription("Fiction");
      expect(category.description).toBe("Fiction");
      expect(validateSpy).toHaveBeenCalledTimes(2);
    });

    it("should activate", () => {
      const category = Category.create({
        name: "Drama",
        is_active: false,
      });
      category.activate();
      expect(category.is_active).toBeTruthy();
      expect(validateSpy).toHaveBeenCalledTimes(1);
    });

    it("should deactivate", () => {
      const category = Category.create({
        name: "Drama",
      });
      category.deactivate();
      expect(category.is_active).toBeFalsy();
      expect(validateSpy).toHaveBeenCalledTimes(1);
    });

    it("should create", () => {
      const category = Category.create({
        name: "test",
        description: "description test",
      });
      expect(category.name).toBe("test");
      expect(category.is_active).toBeTruthy();
      expect(category.description).toBe("description test");
      expect(category.created_at).toBeInstanceOf(Date);
      expect(category.category_id).toBeInstanceOf(Uuid);
      expect(validateSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("Validations", () => {
    it("should return error message when name = null", () => {
      expect(() => Category.create({ name: null })).containsErrorMessages({
        name: [
          "name should not be empty",
          "name must be a string",
          "name must be shorter than or equal to 255 characters",
        ],
      });
    });

    it("should return error message when name = 5", () => {
      expect(() => Category.create({ name: 5 as any })).containsErrorMessages({
        name: [
          "name must be a string",
          "name must be shorter than or equal to 255 characters",
        ],
      });
    });

    it("should return error message when name = +255", () => {
      expect(() =>
        Category.create({ name: "t".repeat(256) })
      ).containsErrorMessages({
        name: ["name must be shorter than or equal to 255 characters"],
      });
    });
    it("should return error message when name = empty string", () => {
      expect(() => Category.create({ name: "" })).containsErrorMessages({
        name: ["name should not be empty"],
      });
    });
  });
});
