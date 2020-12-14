# Lazy Load 3rd Party Scripts

The smart way.

## Install

```
npm install @valu/lazy-script
```

## Usage

```tsx
import { LazyScript } from "@valu/lazy-script";

const SCRIPT = new LazyScript({
    // URL to the script to be loaded
    url: "https://finmun.boost.ai/chatPanel/chatPanel.js",

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

Load the code immediately on click:

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

## Events

Listen to script load events with

```tsx
const unbind = SCRIPT.onStateChange(() => {
    console.log(SCRIPT.state); // "pending" | "loading"  | "ready"
});
```

This can be used to implement loading indicators.

## React

There's a React hook for easy access to the script state from render:

```tsx
import { useLazyScript } from "@valu/lazy-script/react";

function Component() {
    const state = useLazyScript(SCRIPT);
}
```
