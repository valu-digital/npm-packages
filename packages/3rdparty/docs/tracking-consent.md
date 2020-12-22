# TrackingConsent

A class for manager "cookie consent".

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
