# React Intersection Observer

A React Hook for the [Intersection Observer
API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API).

This can be used for lazy loading and rendering when something appears into the
view port

## Install

```
npm install @valu/react-intersection-observer
```

## Usage

```tsx
import { useIntersectionObserver } from "@valu/react-intersection-observer";
```

In a component

```tsx
function LazyVideo() {
    const [loadVideo, setLoadVideo] = useState(false);

    const videoRef = useIntersectionObserver(() => {
        setLoadVideo(true);
    });

    return (
        <Wrapper ref={ref}>{loadVideo ? <Video /> : <Placeholder />}</Wrapper>
    );
}
```

This will render the `<Video>` component only when its wrapper is scrolled to
the view port.

## Options

Following options can passed to the hook:

```tsx
const ref = useIntersectionObserver(fn, {
    /* options */
});
```

-   `active?: boolean`: Set to false to disable
-   `unsupported?: "call" | "ignore"`: What to do when the browser does not support the Intersection observer API
    -   `"call"` calls the call immediately which is the default, `"ignore"` never calls the function
-   `threshold?: number | number[]`: See the [Intersection observer options][options]
-   `root?: Element`: See the [Intersection observer options][options]
-   `rootMargin?: string`: See the [Intersection observer options][options]

[options]: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API#intersection_observer_options
