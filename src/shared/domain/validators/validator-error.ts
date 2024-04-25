import { FieldsErrors } from "./class-validator-interface";

export class EntityValidatorError extends Error {
  constructor(public errors: FieldsErrors, message = "Validation Error") {
    super(message);
  }
  count() {
    return Object.keys(this.errors).length;
  }
}
