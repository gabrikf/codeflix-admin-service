import { Op } from "sequelize";
import { Entity } from "../../../../shared/domain/entity";
import { NotFoundError } from "../../../../shared/domain/errors/not-found.error";
import { SearchParams } from "../../../../shared/domain/repository/search-params";
import { SearchResult } from "../../../../shared/domain/repository/search-result";
import { Uuid } from "../../../../shared/domain/value-objects/uuid.vo";
import { Category } from "../../../domain/category.entity";
import {
  CategorySearchResult,
  ICategoryRepository,
} from "../../../domain/category.repository";
import { CategoryModel } from "./category.model";
import { orderBy } from "lodash";

export class CategorySequelizeRepository implements ICategoryRepository {
  constructor(private categoryModel: typeof CategoryModel) {}
  sortableFields: string[] = ["name", "created_at"];
  async insert(entity: Category): Promise<void> {
    await this.categoryModel.create({
      category_id: entity.category_id.id,
      name: entity.name,
      description: entity.description,
      is_active: entity.is_active,
      created_at: entity.created_at,
    });
  }
  async bulkInsert(entities: Category[]): Promise<void> {
    await this.categoryModel.bulkCreate(
      entities.map((entity) => ({
        category_id: entity.category_id.id,
        name: entity.name,
        description: entity.description,
        is_active: entity.is_active,
        created_at: entity.created_at,
      }))
    );
  }
  async update(entity: Category): Promise<void> {
    const model = await this.findByPkOrThrow(entity.category_id.id);
    await model.update({
      category_id: entity.category_id.id,
      name: entity.name,
      description: entity.description,
      is_active: entity.is_active,
      created_at: entity.created_at,
    });
  }
  async delete(entityId: Uuid): Promise<void> {
    const model = await this.findByPkOrThrow(entityId.id);
    model.destroy();
  }
  protected async findByPkOrThrow(id: string) {
    const model = await this.categoryModel.findByPk(id);
    if (!model) {
      throw new NotFoundError(id, this.getEntity());
    }
    return model;
  }
  async findById(entityId: Uuid): Promise<Category | null> {
    const category = await this.categoryModel.findByPk(entityId.id);
    return new Category({
      category_id: entityId,
      name: category.name,
      description: category.description,
      is_active: category.is_active,
      created_at: category.created_at,
    });
  }
  async findAll(): Promise<Category[]> {
    const categories = await this.categoryModel.findAll();
    return categories.map(
      (category) =>
        new Category({
          name: category.name,
          category_id: new Uuid(category.id),
          created_at: category.createdAt,
          description: category.description,
          is_active: category.is_active,
        })
    );
  }
  getEntity(): new (...args: any[]) => Category {
    return Category;
  }
  async search(props: SearchParams<string>): Promise<CategorySearchResult> {
    const offset = (props.page - 1) * props.per_page;
    const limit = props.per_page;

    const { rows: models, count } = await this.categoryModel.findAndCountAll({
      ...(props.filter && {
        where: {
          name: { [Op.like]: `%${props.filter}%` },
        },
      }),
      ...(props.sort && this.sortableFields.includes(props.sort)
        ? { order: [props.sort, props.sort_dir] }
        : { order: ["created_at", "desc"] }),
      offset,
      limit,
    });
    return new CategorySearchResult({
      items: models.map(
        (model) =>
          new Category({
            category_id: new Uuid(model.category_id),
            name: model.name,
            created_at: model.createdAt,
            description: model.description,
            is_active: model.is_active,
          })
      ),
      current_page: props.page,
      per_page: props.per_page,
      total: count,
    });
  }
}
