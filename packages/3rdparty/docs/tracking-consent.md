# TrackingConsent

A class for managing "cookie consent".

## Usage

```tsx
import { TrackingConsent } from "@valu/3rdparty/tracking-consent";
const tc = TrackingConsent.getSingleton();

// All event handler must be added to tc instance before calling .init()
tc.init();
```

By default this does not do anything but it can be combined with the
[IFrames](iframes.md) and [LazyScript](lazy-script.md) to load them when the
consent is given.

```tsx
import { LazyScript } from "@valu/3rdparty/lazy-script";
import { getIFramesGlobal } from "@valu/3rdparty/iframes-global";

const tc = TrackingConsent.getSingleton();

tc.onEvent((event) => {
    // the event is one of:
    // "request-prompt" | "consented" | "declined" | "forget" | "init";

    if (event === "consented") {
        getIFramesGlobal().unblockAll();
        LazyScript.disableAllBlocking();
    }
});

tc.init();
```

The response status is available in `tc.response` which has type of

```tsx
interface ConsentResponse {
    status: "not-given" | "declined" | "consented";
    date: string | undefined;
}
```

## API

-   `.consent()`: Give tracking consent
-   `.decline()`: Decline tracking consent
-   `.forget()`: Forget previously given consent
    -   NOTE: You should reload the tab after this to unload the trackers

## React Hook

```tsx
import { useTrackingConsent } from "@valu/3rdparty/react-tracking-consent";

function Component() {
    //  "consented" | "declined" | "not-given"
    const consent = useTrackingConsent(tc);
}
```

## Cookiebot integration

The consent UI can be implement using the event handler and/or the React
hook, but there's also a premade [Cookiebot](https://www.cookiebot.com/)
integration:

```tsx
import { TrackingConsent } from "@valu/3rdparty/tracking-consent";
import { connectCookieBot } from "@valu/3rdparty/cookiebot";

const tc = TrackingConsent.getSingleton();

connectCookieBot(tc, "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxxx);

tc.init();
```

## Google Tag Manager Events

Instead of hard coding unblocking logic to the application code you can
delegate it to Google Tag Manager.

TrackingConsent emits following GTM events:

-   `valu-tracking-response-consented`: Emited when user gives the tracking consent
    -   Is also emitted on `tc.init()` (page load) when response has been given previously
-   `valu-tracking-response-declined`: Emited when user declines the tracking consent
    -   Is also emitted on `tc.init()`
-   `valu-tracking-response-not-given`: Emitted on page load when no response has been given
    -   Is also emitted on `tc.forget()`

You can bind external scripts like Google Analtics to these but you can also manage:

-   [LazyScript unblocking](lazy-script.md#unblocking) via the `LSU` global.
-   [IFrames unblocking]()
