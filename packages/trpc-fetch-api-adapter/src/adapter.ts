import { AnyRouter } from "@trpc/server";

// XXX Cannot import these directly from "@trpc/server"
import type {
    TRPCResponse,
    TRPCResult,
} from "@trpc/server/dist/declarations/src/rpc";

// Copy pasted from https://github.com/trpc/trpc/blob/74c0bb9c76f57805672fbb02596f5ed5e5c339e5/packages/server/src/rpc/codes.ts#L11
// Because I was not able to import it Remix without bundling errors
/**
 * JSON-RPC 2.0 Error codes
 *
 * `-32000` to `-32099` are reserved for implementation-defined server-errors.
 * For tRPC we're copying the last digits of HTTP 4XX errors.
 */
export const TRPC_ERROR_CODES_BY_KEY = {
    /**
     * Invalid JSON was received by the server.
     * An error occurred on the server while parsing the JSON text.
     */
    PARSE_ERROR: -32700,
    /**
     * The JSON sent is not a valid Request object.
     */
    BAD_REQUEST: -32600, // 400
    /**
     * Internal JSON-RPC error.
     */
    INTERNAL_SERVER_ERROR: -32603,
    // Implementation specific errors
    UNAUTHORIZED: -32001, // 401
    FORBIDDEN: -32003, // 403
    NOT_FOUND: -32004, // 404
    METHOD_NOT_SUPPORTED: -32005, // 405
    TIMEOUT: -32008, // 408
    PRECONDITION_FAILED: -32012, // 412
    PAYLOAD_TOO_LARGE: -32013, // 413
    CLIENT_CLOSED_REQUEST: -32099, // 499
} as const;

function trpcRespond(status: number, data: TRPCResponse) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json",
        },
    });
}

export function createFetchAPIHandler<TRouter extends AnyRouter>(opts: {
    router: TRouter;
    createContext?(req: Request): Promise<any>;
}): (request: Request) => Promise<Response> {
    async function respond(req: Request) {
        const url = new URL(req.url);
        const context = opts.createContext ? await opts.createContext(req) : {};
        const caller = opts.router.createCaller(context);

        // Assume that the last part of the request path name is the trpc path.
        // XXX This might be bit to naive?
        const trpcPath = url.pathname.replace(/\/+$/, "").split("/").pop();

        if (!trpcPath) {
            return trpcRespond(400, {
                id: null,
                error: {
                    code: TRPC_ERROR_CODES_BY_KEY.BAD_REQUEST,
                    message:
                        "Could not find trpc path from the request: " + req.url,
                    data: {},
                },
            });
        }

        if (url.searchParams.get("batch")) {
            return trpcRespond(400, {
                id: null,
                error: {
                    code: TRPC_ERROR_CODES_BY_KEY.BAD_REQUEST,
                    message: `Batching is not supported yet. Use the batch-free link "httpLink".`,
                    data: {},
                },
            });
        }

        if (req.method === "GET") {
            const result: TRPCResult = await caller.query(
                trpcPath,
                JSON.parse(url.searchParams.get("input") ?? "{}"),
            );

            return trpcRespond(200, {
                id: null,
                result: {
                    type: "data",
                    data: result,
                },
            });
        } else if (req.method === "POST") {
            const body = await req.text();
            const payload = body === "" ? undefined : JSON.parse(body);

            const result: TRPCResult = await caller.mutation(trpcPath, payload);

            return trpcRespond(200, {
                id: null,
                result: {
                    type: "data",
                    data: result,
                },
            });
        }

        return trpcRespond(405, {
            id: null,
            error: {
                code: TRPC_ERROR_CODES_BY_KEY.METHOD_NOT_SUPPORTED,
                message: "Method not supported: " + req.method,
                data: {},
            },
        });
    }

    return async function handler(req: Request) {
        try {
            return await respond(req);
        } catch (error: any) {
            // XXX Is there a way to get TRPCErrorResponse directly from the
            // errors thrown by the trcp router?
            console.error("Failed make trpc response", error?.stack ?? error);
            return trpcRespond(500, {
                id: null,
                error: {
                    code: TRPC_ERROR_CODES_BY_KEY.INTERNAL_SERVER_ERROR,
                    message: "Unknown error: " + String(error),
                    data: {},
                },
            });
        }
    };
}
