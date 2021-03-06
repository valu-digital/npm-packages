# Sync Valtio to Location

Make [Valtio][] state linkable by syncing it to URL location using the browser
history api.

[valtio]: https://github.com/pmndrs/valtio

## Install

```
npm install @valu/valtio-location
```

## Usage

```tsx
import { proxy } from "valtio";
import { sync } from "@valu/valtio-location";

const state = proxy({ tags: [] });

const { start } = sync(state);

start();
```

This will sync the Valtio state to query string key `data` as JSON string. If
you need to customize the key you can pass it as an option:

```tsx
const { start } = sync(state, { key: "my-state" });
```

You can also completely customize the url writing for prettier urls or partial syncing:

```tsx
const { start } = sync(state, {
    readURL(url) {
        const tags = (url.searchParams.get("tags") || "")
            .split(",")
            .filter(Boolean);

        return { tags };
    },
    writeURL(state, url) {
        url.searchParams.set("tags", state.tags.join(","));
    },
});
```

The `url` is an [URL](https://developer.mozilla.org/en-US/docs/Web/API/URL) instance.

## React.js SSR

If you are using Next.js like SSR rendering React frameworks and you are doing
only client-side state you probably want to start the syncing after the first
render to avoid hydration errors

You can do with `useEffect()`:

```tsx
function Component() {
    useEffect(start, []);
}
```

The `start()` function returns a `stop()` function which can be used as the
`useEffect()` cleanup function.

## Next.js

When using Next.js you must pass in the Next.js router because the default
behaviour of using the `history.replaceState()` api breaks the internal Next.js
state.

```ts
import Router from "next/router";

const { start } = sync(state, { nextjsRouter: Router });
```

Background <https://github.com/vercel/next.js/issues/29252#issuecomment-923998931>
