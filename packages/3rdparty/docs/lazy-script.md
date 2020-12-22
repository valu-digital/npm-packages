# LazyScript

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

## Promise API

The promise is a lazy binding which must be combined with `SCRIPT.now()` call
for it resolve.

```tsx
const chatPanel = await SCRIPT.promise();
```

Or trigger the loading immediately with `{ now: true }`:

```tsx
const chatPanel = await SCRIPT.promise({ now: true });
```

## Events

Listen to script load events with

```tsx
const unbind = SCRIPT.onStateChange(() => {
    //  "idle" | "blocked" | "waiting-unblock" | "loading" | "ready"
    console.log(SCRIPT.state);
});
```

This can be used to implement loading indicators.

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

### Google Tag Manager

The global is mainly for unblocking scripts using Google Tag Manager.

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

## React

There's a React hook for easy access to the script state from render:

```tsx
import { useLazyScript } from "@valu/lazy-script/react";

function Component() {
    //  "idle" | "blocked" | "waiting-unblock" | "loading" | "ready"
    const state = useLazyScript(SCRIPT);
}
```
