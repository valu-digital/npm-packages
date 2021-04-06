# LazyScript

A class for safely loading external scripts.

## Usage

Learn by example:

```tsx
import { LazyScript } from "@valu/3rdparty/lazy-script";

const SCRIPT = new LazyScript({
    // Idendifier for the the global array unblocking
    name: "chatpanel",

    // URL to the script to be loaded
    src: "https://finmun.boost.ai/chatPanel/chatPanel.js",

    // Set to true to prevent script from loading until it is unblocked.
    // Defaults to false.
    blocked: false,

    // Initialization code to be executed only once when the script was loaded
    initialize: () => {
        if (typeof window.boostChatPanel !== "function") {
            throw new Error("window.boostChatPanel not configured properly");
        }

        const chatPanel = window.boostChatPanel({
            apiUrlBase: "https://finmun.boost.ai/api",
        });

        return chatPanel;
    },
});
```

Lazily bind event handlers:

```tsx
SCRIPT.lazy((chatPanel) => {
    chatPanel.addEventListener("chatPanelClosed", () => {
        alert("Chat closed");
    });
});
```

Load the code immediately:

```tsx
document.querySelector("button").addEventListener("click", () => {
    SCRIPT.now((chatPanel) => {
        chatPanel.show();
    });
});
```

Things to note:

-   Calling `.now()` triggers all previous and future `.lazy()` bindings
-   Calling `.lazy()` alone does not do anything
-   Calling `.now()` multiple times is ok. The script will be loaded only once and the initialization script is executed only once too
-   The callbacks will get the return value of the `initialize` function
-   Both `now()` and `lazy()` will execute the given callback only once

## Unblocking

If the script is blocked with `blocked: true` it must be unblocked.

Explicitly

```ts
SCRIPT.unblock();
```

All at once

```tsx
LazyScript.disableAllBlocking();
```

Using global `LSU` array:

```tsx
LSU.push("chatpanel");
```

The `"chatpanel"` must match with the `name` constructor option.
If the array does not exists you must create it first.

"LSU" stands for "Lazy Script Unblock".

This global must be defined manually

<!-- prettier-ignore-start -->
```html
<script>if (!window.LSU) { window.LSU = []; }</script>
```
<!-- prettier-ignore-end -->

Or if you are using SSRed React like Next.js:

```tsx
import { LazyScriptGlobal } from "@valu/3rdparty/react-ssr";

class MyDocument extends Document {
    render() {
        return (
            <Html>
                <Head>
                    <LazyScriptGlobal />
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

### Google Tag Manager

The global is mainly for unblocking scripts using Google Tag Manager with
"Custom HTML" tags.

Example setup:

<!-- prettier-ignore-start -->
```html
<!-- Define global LSU array before GTM so it is visible for it -->
<script>if(!window.LSU){window.LSU=[]}</script>

<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-xxxxxxx');</script>
<!-- End Google Tag Manager -->
```
<!-- prettier-ignore-end -->

This works well with the [TrackingConsent GTM Events](tracking-consent.md#google-tag-manager-events).

## API

Instance:

-   `.now(cb)`: Call the given callback ASAP with `initialize` value
    -   Without the callback it can be used to just trigger the `.lazy()` bindings
-   `.lazy(cb)`: Call the given callback with `initialize` value when `.now()` is first called
-   `.promise()`: Return a lazy promise which resolves when `.now()` is called
    -   The promise resolves to the `initialize` value
    -   Can be resolved immediately with `.promise({now: true})`
-   `.onStateChange(cb: (state: string) => void)`: Called when the state of the script changes
    -   `"idle" | "blocked" | "waiting-unblock" | "loading" | "ready"`
    -   This can be used to implement loading indicators.
-   `.unblock()`: Unblock the given script if it was created with `blocked: true`
-   `.state`: The current state of the script
    -   `"idle" | "blocked" | "waiting-unblock" | "loading" | "ready"`
-   `.mutate(node: HTMLScriptElement)`: Mutate the script node before it is added to the DOM tree.
    -   Some external scripts might require some additional attributes like `id` and data attributes

Class:

-   `LazyScript.disableAllBlocking()` : Disable blocking from all current and future scripts

## React

There's a React hook for easy access to the script state from render:

```tsx
import { useLazyScript } from "@valu/lazy-script/react";

function Component() {
    const state = useLazyScript(SCRIPT);
}
```

## TypeScript

Usually 3rd party scripts will assign some global variable which you are
supposed to access. But this is an issue for TypeScript since the type system
does not know anything about it.

The recommendation is that you'll write the type interface(s) manually

```tsx
interface ChatPanel {
    addEventListener(event: string, cb: Function): void;
    removeEventListener(event: string, cb: Function): void;
    show(): void;
}

interface ChatPanelBoost {
    (options: {
        apiUrlBase: string;
        filterValues: string[];
        botIconUrl: string;
    }): ChatPanel;
}
```

And extend the global Window:

```tsx
declare global {
    interface Window {
        boostChatPanel?: ChatPanelBoost;
    }
}
```

This allows you to reference `window.boostChatPanel(...)` like in the first
example. The optional (`?`) is used to correctly model that the script is not
initially loaded and thus the global is missing.
