# IFrames

A class for blocking and unblocking iframes.

It must be initialized in the `<head>` before you have created any iframes.

## Next.js and Headup

This can be adapted to any React SSR frameworks.

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

-   `.unblockAll()`: Unblock all existing and future iframes
-   `.unblock(node)`: Unblock single iframe node
-   `.isBlocked(node)`: Returns true if the given node is blocked
-   `.forEachIFrame(callback)`: Iterate through all iframe nodes
