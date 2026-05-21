export class NotFoundError extends Error {
  readonly code = "NOT_FOUND";
  constructor(entity: string, id?: string) {
    super(id ? `${entity} not found: ${id}` : `${entity} not found`);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends Error {
  readonly code = "CONFLICT";
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class InvalidStateError extends Error {
  readonly code = "INVALID_STATE";
  constructor(entity: string, current: string, expected: string) {
    super(`${entity} is "${current}", expected "${expected}"`);
    this.name = "InvalidStateError";
  }
}

export class ValidationError extends Error {
  readonly code = "VALIDATION_ERROR";
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
