# React Inline

Tool for writing inline Scripts and CSS in React.

Often used in Next.js `_document.tsx` files.

## Install

```
npm install @valu/react-inline
```

## Inline Script

```tsx
import { InlineScript } from "@valu/react-inline";

<InlineScript
    fn={function () {
        console.log("Inline script! ");
    }}
/>;
```

With arguments

```tsx
<InlineScript
    args={["World"]}
    fn={function (name: string) {
        console.log("Hello " + name);
    }}
/>
```

Caveats:

-   The script is inlined with `Function#toString()` so you cannot reference
    variables in the parent closures.
-   If the script is SSR rendered (ex. in Next.js `_document.tsx`, it might not get transpiled. It's better to avoid modern JavaScript syntax if legacy browser support is required
    -   TypeScript types are stripped always though.
-   The args are serialized with `JSON.stringify()`

## Raw Inline Script

A tiny wrapper for `dangerouslySetInnerHTML`. Use for 3rdparty embeding such as
Google Tag Manager.

```tsx
<InlineScript.Raw
    code={`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','***');`}
/>
```

## Inline Styles

Inline font loader CSS for example

```tsx
import { InlineStyle, css } from "@valu/react-inline";

const fontCSS = css`
    @font-face {
        font-family: "ApexNewBookRegular";
        src: url("/fonts/ApexNew-Book.otf");
        font-display: swap;
    }
    @font-face {
        font-family: "ApexNewBookBold";
        src: url("/fonts/ApexNew-Bold.otf");
        font-display: swap;
    }
    @font-face {
        font-family: "ApexNewBookLight";
        src: url("/fonts/ApexNew-Light.otf");
        font-display: swap;
    }
`;

<InlineStyle css={fontCSS} />;
```

Alternative API when you have a colliding `css` template tags (ex. with react-bemed):

```tsx
<InlineStyle
    css={(css) => css`
        body,
        html {
            padding: 0;
            margin: 0;
        }
    `}
/>
```
