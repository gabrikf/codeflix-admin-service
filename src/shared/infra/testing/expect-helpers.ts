import { ClassValidatorFields } from "../../domain/validators/class-validator-fields";
import { FieldsErrors } from "../../domain/validators/class-validator-interface";
import { EntityValidatorError } from "../../domain/validators/validator-error";
type Expected =
  | {
      validator: ClassValidatorFields<any>;
      data: any;
    }
  | (() => any);

expect.extend({
  containsErrorMessages(expect: Expected, received: FieldsErrors) {
    if (typeof expect === "function") {
      try {
        expect();
        return isValid();
      } catch (e) {
        const error = e as EntityValidatorError;
        return assertContainsErrorsMessages(error.errors, received);
      }
    } else {
      const { data, validator } = expect;
      const validated = validator.validate(data);
      if (validated) {
        return isValid();
      }
      return assertContainsErrorsMessages(validator.errors, received);
    }
  },
});

function assertContainsErrorsMessages(
  expected: FieldsErrors,
  received: FieldsErrors
) {
  const isMatch = expect.objectContaining(received).asymmetricMatch(expected);

  return isMatch
    ? isValid()
    : {
        pass: false,
        message: () =>
          `The validation errors not contains ${JSON.stringify(
            received
          )}. Current: ${JSON.stringify(expected)}`,
      };
}

function isValid() {
  return { pass: true, message: () => "" };
}
