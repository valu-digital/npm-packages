# Sync Valtio to Location

Make [Valtio][] state linkable by syncing it to URL location

[valtio]: https://github.com/pmndrs/valtio

## Install

```
npm install @valu/valtio-location
```

## Usage

```tsx
import { proxy } from "valtio";

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
