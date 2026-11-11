import { env } from "@api/features/shared/env/index";

interface RequestHandler {
  handle: (request: Request) => Promise<Response>;
}

export const callAsService = (
  app: RequestHandler,
  path: string,
  body: unknown,
) =>
  app.handle(
    new Request(`http://localhost${path}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.API_SECRET}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    }),
  );

export const closeBody = (caseId: string) => ({
  caseId,
  evidence: "Repeat HbA1c confirmed the result and treatment started.",
  plan: "Review again in three months at the clinic.",
});
