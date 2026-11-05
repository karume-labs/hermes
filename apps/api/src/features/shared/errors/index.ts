import { Elysia } from "elysia";

export class NotFoundError extends Error {
  readonly status = 404;
  readonly code = "NOT_FOUND";
  constructor(message = "Not found") {
    super(message);
  }
}

export class UnauthorizedError extends Error {
  readonly status = 401;
  readonly code = "UNAUTHORIZED";
  constructor(message = "Unauthorized") {
    super(message);
  }
}

export class ConflictError extends Error {
  readonly status = 409;
  readonly code = "CONFLICT";
  constructor(message = "Conflict") {
    super(message);
  }
}

// Malformed lab feed (missing PID, no OBX, unparsable timestamp).
export class UnprocessableError extends Error {
  readonly status = 422;
  readonly code = "UNPROCESSABLE";
  constructor(message = "Unprocessable payload") {
    super(message);
  }
}

export const errorHandlerPlugin = new Elysia()
  .error({
    NotFoundError,
    ConflictError,
    UnauthorizedError,
    UnprocessableError,
  })
  .onError(({ error, set }) => {
    if (
      error instanceof NotFoundError ||
      error instanceof ConflictError ||
      error instanceof UnauthorizedError ||
      error instanceof UnprocessableError
    ) {
      set.status = error.status;
      return { success: false, code: error.code, message: error.message };
    }
    return undefined;
  });
