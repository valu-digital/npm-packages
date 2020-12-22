# IFrames

A class for blocking and unblocking iframes.

It must be initialized in the `<head>` before you have created any iframes.

## Next.js and Headup

This can be adapted to other React SSR frameworks too.

In `_document.tsx`

```tsx
import Document, { Html, Head, Main, NextScript } from "next/document";

import { BlockIFrames } from "@valu/3rdparty/react-ssr";

class MyDocument extends Document {
    render() {
        return (
            <Html>
                <Head>
                    {/* 👇👇👇👇 */}
                    <BlockIFrames />
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}

export default MyDocument;
```

The `BlockIFrames` component will render the blocking code which as minimized
inline script so it won't cause any render blocking requests and it can block
any server rendered iframes. It will expose the instance as a global which
can be accessed in the browser code with:

```tsx
import { getIFramesGlobal } from "@valu/3rdparty/iframes-global";
const iframes = getIFramesGlobal();
```

## API

Instance

-   `.unblockAll()`: Unblock all existing and future iframes
-   `.unblock(node)`: Unblock single iframe node
-   `.isBlocked(node)`: Returns true if the given node is blocked
-   `.forEachIFrame(callback)`: Iterate through all iframe nodes

## Google Tag Manager

When unblocking iframes from GTM you must render the `<BlockIframe>`
component before the GTM script tag so GTM can see the global.

In a "Custom HTML" tag you can access the iframe api via the `ValuIFrames`
global.

Example

```html
<script>
    ValuIFrames.unblockAll();
</script>
```

This works well with the [TrackingConsent GTM
Events](tracking-consent.md#google-tag-manager-events).

Setup example with Google Tag Manager in Next.js:

```tsx
class MyDocument extends Document {
    render() {
        return (
            <Html>
                <Head>
                    <BlockIFrames />
                    <script
                        dangerouslySetInnerHTML={{
                            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];
                                w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
                                var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
                                j.async=true;
                                j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})
                                (window,document,'script','dataLayer','GTM-xxxxxxx');`,
                        }}
                    ></script>
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}
```

## Placeholders

When the iframes are blocked you can render a placeholder for it:

```tsx
function IframePlaceholder() {
    return <h1>Blocked.</h1>;
}

// ...

<BlockIFrames placeholder={<IframePlaceholder />} />;
```

NOTE: The component is SSR rendered with React into the iframe `src`
attribute so it cannot contain any interactivity. No event handler or react
state.

But there's a small scripting API if you want to make an unblock button inside the iframe:

```tsx
<BlockIFrames
    placeholder={<IframePlaceholder />}
    script={(api) => {
        document
            .querySelector("button.unblock")
            .addEventListener("click", () => {
                api.unblock();
            });
    }}
/>
```

The will unblock the single iframe when a button with class name of "unblock"
is clicked inside the placeholder.

## Usage without React

This can be used in a tradional websites too without React. Ask for the docs
if you need them.
