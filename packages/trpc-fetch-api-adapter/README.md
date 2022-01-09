# Fetch API Adapter for tRPC

Proof of concept Fetch API adapter for [tRPC](https://trpc.io/). This allows you
to deploy tRPC endoints to Remix routes and possibly to other systems using the Fetch API

By "Fetch API" we mean systems that implement the [Request][] and [Response][]
objects specified in the [Fetch Standard][] such as [Remix][], [CloudFlare
Workers][], [Deno][] and Service Workers. This is some times refered as "The
Web Platform". In theory this adapter should allow to deploy tRPC on all these
systems. But in practice it might not be possible since tRPC might have some
hard Node.js dependecies. Only Remix on Node.js has been tested so
far.

[request]: https://developer.mozilla.org/en-US/docs/Web/API/Request
[response]: https://developer.mozilla.org/en-US/docs/Web/API/Response
[fetch standard]: https://fetch.spec.whatwg.org/
[remix]: https://remix.run/
[cloudflare workers]: https://workers.cloudflare.com/
[deno]: https://deno.land/

This implementation is very basic. No batching support and error handling might
be bit lacking. But it does support queries, mutations and request contexts.

Hopefully we can see this implemented in tRPC core some day. Here's a tracking issue https://github.com/trpc/trpc/issues/1374

## Install

```
npm install @valu/trpc-fetch-api-adapter
```

## Usage in Remix

Create a route file to `app/routes/trpc/$.ts` with a tRPC router:

```ts
import * as trpc from "@trpc/server";
import type { ActionFunction } from "remix";
import { createFetchAPIHandler } from "@valu/trpc-fetch-api-adapter";

interface MyContext {}

export const appRouter = trpc.router<MyContext>().query("hello", {
    resolve() {
        return {
            greeting: "Hello Remix",
        };
    },
});

export type AppRouter = typeof appRouter;

const handler = createFetchAPIHandler({
    router: appRouter,
    async createContext(req): Promise<MyContext> {
        return {};
    },
});

// Handle GET requests like /trpc/hello
export const loader: LoaderFunction = async ({ request }) => {
    return await handler(request);
};

// POST request are actions in Remix so we need to add different handler for it
export const action: ActionFunction = async ({ request }) => {
    return await handler(request);
};
```

And create a client without batching

```ts
import { createTRPCClient } from "@trpc/client";
import { httpLink } from "@trpc/client/links/httpLink";

import type { AppRouter } from "./routes/trpc/$";

const client = createTRPCClient<AppRouter>({
    links: [
        httpLink({
            url: "http://localhost:3000/trpc",
        }),
    ],
});
```

## Usage in CloudFlare Workers

Full example here https://github.com/esamattis/trpc-cloudflare-worker

```ts
import * as trpc from "@trpc/server";";
import { createFetchAPIHandler } from "@valu/trpc-fetch-api-adapter";

export const appRouter = trpc.router<MyContext>().query("hello", {
    resolve() {
        return {
            greeting: "Hello from CloudFlare",
        };
    },
});

const handler = createFetchAPIHandler({ router: appRouter });

addEventListener("fetch", async (event) => {
    event.respondWith(handler(event.request));
});
```
