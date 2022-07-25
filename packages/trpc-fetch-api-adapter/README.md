# Fetch API Adapter for tRPC

Proof of concept Fetch API adapter for [tRPC](https://trpc.io/). This allows you
to deploy tRPC endoints to Remix routes and possibly to other systems using the Fetch API

By "Fetch API" we mean systems that implement the [Request][] and [Response][]
objects specified in the [Fetch Standard][] such as [Remix][], [CloudFlare
Workers][], [Deno][] and Service Workers. This is some times refered as "The
Web Platform". This adapter should allow to deploy tRPC on all these
systems but in practice it is bit tricky since tRPC has some hard dependencies on Node.js
but there are [workarounds](https://github.com/trpc/trpc/issues/1375).

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
// trpc.ts
import { createTRPCClient } from "@trpc/client";
import { httpLink } from "@trpc/client/links/httpLink";

import { createReactQueryHooks } from "@trpc/react";

import type { AppRouter } from "../routes/trpc/$";

export const trpc = createReactQueryHooks<AppRouter>();

export const client = createTRPCClient<AppRouter>({
  links: [
    httpLink({
      url: "http://localhost:3000/trpc",
    }),
  ],
});

```

In order to use tRPC queries you must wrap the root `<Outlet />` with the necessary [tRPC/react-query providers](https://trpc.io/docs/react#3-add-trpc-providers):

```ts
// root.tsx
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

import { QueryClient, QueryClientProvider } from "react-query";
import { client, trpc } from "./utils/trpc";

const queryClient = new QueryClient();

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <trpc.Provider client={client} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <Outlet />
          </QueryClientProvider>
        </trpc.Provider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

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
