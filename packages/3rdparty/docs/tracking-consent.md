# TrackingConsent

A class for managing "cookie consent".

## Usage

```tsx
import { TrackingConsent } from "@valu/3rdparty/tracking-consent";
const tc = TrackingConsent.getSingleton();

// All event handlers must be added to the tc instance before calling .init()
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
    if (event === "consented") {
        getIFramesGlobal().unblockAll();
        LazyScript.disableAllBlocking();
    }
});

tc.init();
```

## API

Instance:

-   `.init()`: Initialize the object. This should be called on page load after setting the event handlers
-   `.consent()`: Give tracking consent
-   `.decline()`: Decline tracking consent
-   `.forget()`: Forget previously given consent
-   `.showPrompt()`: Show the consent form
    -   This basically just emits the `"request-prompt"` event which is listened by the Cookiebot integration
-   `.onEvent(cb: (event: string) => void)`: The callback will be called on various events
    -   Possible events are: `"request-prompt" | "consented" | "declined" | "forget" | "init"`
-   `.response` The response status object
    -   `{ status: "not-given" | "declined" | "consented"; date: string | undefined; }`

## Discarding the consent

When discarding the tracking consent with `.forget()` you must reload the
page for the trackers to properly unload. The forget method returns an promise when
then consent has been revoked.

Example:

```tsx
function discardCookieConsent() {
    if (confirm("This will reload the page, OK?")) {
        TrackingConsent.getSingleton()
            .forget()
            .finally(() => {
                window.location.reload();
            });
    }
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

You can bind external scripts like Google Analytics to these but you can also manage:

-   [LazyScript unblocking](lazy-script.md#unblocking) via the `LSU` global
-   [IFrames unblocking](iframes.md#google-tag-manager) via the `ValuIFrames` global

The event trigger in GTM looks like this:

![image](https://user-images.githubusercontent.com/225712/102896488-25baf480-446f-11eb-93a9-4e21309d8d7b.png)

## Google Tag Manager Data Layer Variable

TrackingConsent also sets dataLayer variable named `valuTrackingResponse` to
the response value. It can be used to create "Tag Manager "Variables" which
can subsequently be used to add conditions to Tag Manager Triggers.

Variable definition

![image](https://user-images.githubusercontent.com/225712/102990122-83a71500-451f-11eb-9804-12552ddbc72c.png)

Trigger conditioning

![image](https://user-images.githubusercontent.com/225712/102990297-cc5ece00-451f-11eb-8003-f1631f082aed.png)
