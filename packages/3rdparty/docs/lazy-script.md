# LazyScript

## Usage

Learn by example:

```tsx
import { LazyScript } from "@valu/3rdparty/lazy-script";

const SCRIPT = new LazyScript({
    name: "chatpanel",

    // URL to the script to be loaded
    src: "https://finmun.boost.ai/chatPanel/chatPanel.js",

    // Set to true to prevent script from loading until it is unblocked
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

```tsx
// trigger loading, you can do this later as well and leave the promise hanging
SCRIPT.now();

const chatPanel = await SCRIPT.promise();
```

## Events

Listen to script load events with

```tsx
const unbind = SCRIPT.onStateChange(() => {
    console.log(SCRIPT.state); // "pending" | "loading"  | "ready"
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

Using global array:

```tsx
window.LazyScriptUnblock.push("chatpanel");
```

The `"chatpanel"` must match with the `name` constructor option.
If the array does not exists you must create it first.

This is mainly for unblocking scripts from Google Tag Manager.

## React

There's a React hook for easy access to the script state from render:

```tsx
import { useLazyScript } from "@valu/lazy-script/react";

function Component() {
    const state = useLazyScript(SCRIPT);
}
```
