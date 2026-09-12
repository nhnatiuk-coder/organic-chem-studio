import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

type Environment = { INSTRUCTOR_PASSWORD?: unknown };

// Keep the guide completely unavailable unless it is deliberately re-enabled
// in a future code change.
const INSTRUCTOR_GUIDE_ENABLED = false;

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

/**
 * Protect the instructor-only question-bank review before the React app is
 * served. The password lives in Cloudflare as INSTRUCTOR_PASSWORD, never in
 * the client bundle or Git repository.
 */
function instructorAuthorized(request: Request, env: unknown): boolean {
  const expected = (env as Environment).INSTRUCTOR_PASSWORD;
  if (typeof expected !== "string" || !expected) return false;

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Basic ")) return false;

  try {
    const credentials = atob(authorization.slice(6));
    const separator = credentials.indexOf(":");
    return separator >= 0 && credentials.slice(separator + 1) === expected;
  } catch {
    return false;
  }
}

function instructorPasswordRequired(request: Request, env: unknown): Response | null {
  const { pathname } = new URL(request.url);
  if (pathname !== "/instructor" && pathname !== "/instructor/") return null;

  if (!INSTRUCTOR_GUIDE_ENABLED) {
    return new Response("Not found.", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  if (instructorAuthorized(request, env)) return null;
  const passwordConfigured = typeof (env as Environment).INSTRUCTOR_PASSWORD === "string";
  return new Response(
    passwordConfigured
      ? "Instructor password required."
      : "Instructor access is not configured yet. Add the INSTRUCTOR_PASSWORD secret in Cloudflare.",
    {
      status: passwordConfigured ? 401 : 503,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        ...(passwordConfigured
          ? { "www-authenticate": 'Basic realm="Instructor Review", charset="UTF-8"' }
          : {}),
      },
    },
  );
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const accessResponse = instructorPasswordRequired(request, env);
      if (accessResponse) return accessResponse;
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
