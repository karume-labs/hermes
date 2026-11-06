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

export class TooManyRequestsError extends Error {
  readonly status = 429;
  readonly code = "TOO_MANY_REQUESTS";
  constructor(message = "Too many attempts. Try again shortly.") {
    super(message);
  }
}

// A required provider (SMS gateway, mailer) is not configured or is down.
export class ServiceUnavailableError extends Error {
  readonly status = 503;
  readonly code = "SERVICE_UNAVAILABLE";
  constructor(message = "Service temporarily unavailable") {
    super(message);
  }
}

export class ForbiddenError extends Error {
  readonly status = 403;
  readonly code = "FORBIDDEN";
  constructor(message = "Not permitted") {
    super(message);
  }
}

export const errorHandlerPlugin = new Elysia()
  .error({
    NotFoundError,
    ConflictError,
    UnauthorizedError,
    UnprocessableError,
    TooManyRequestsError,
    ServiceUnavailableError,
    ForbiddenError,
  })
  .onError(({ error, set, code }) => {
    if (
      error instanceof NotFoundError ||
      error instanceof ConflictError ||
      error instanceof UnauthorizedError ||
      error instanceof UnprocessableError ||
      error instanceof TooManyRequestsError ||
      error instanceof ServiceUnavailableError ||
      error instanceof ForbiddenError
    ) {
      set.status = error.status;
      return { success: false, code: error.code, message: error.message };
    }
    // Validation envelopes are safe to return; anything else must not leak
    // SQL text or stack traces to the caller.
    if (code === "VALIDATION" || code === "PARSE") return;
    set.status = 500;
    return {
      success: false,
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Reference the request id in the logs.",
    };
  });
