# @valu/assert

Tiny assertion tool for working with nullable values in (strict) TypeScript
especially with types generated from GraphQL queries.

This library has a concept called "nil" which means `null` or `undefined`.

## `notNil()`

Type guard for filtering nil values out

```tsx
import { notNil } from "@valu/assert";

type Item = { value: number } | null | undefined;

const list: Item[] = [null, undefined, { value: 1 }];

list.filter(notNil).map((item) => {
    item.value; // ok!
});
```

## `assertNotNil()`

Assertion function for removing nil values.

```tsx
import { assertNotNil } from "@valu/assert";

declare const item: { value: number } | null | undefined;

assertNotNil(item, "Optional custom error message");

item.value; // ok!
```

## `assertIs()`

Assert that value is explicitly of the given type

```tsx
import { assertIs } from "@valu/assert";

declare const item: { value: number } | boolean | null;

assertIs(item, false as const, "Not false");

item; // item === false
```

## `is()`

Same as `assertIs()` but as type guard

```tsx
import { is } from "@valu/assert";

declare const item: { value: number } | boolean | null;

if (is(item, false as const)) {
    item; // item === false
}
```
