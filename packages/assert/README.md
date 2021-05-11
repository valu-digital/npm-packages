# @valu/assert

Small collection of [type predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
and [assertion functions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#assertion-functions).

Helps working with possibly undefined types generated from GraphQL queries.

This library has its own concept called "nil" which means `null` or `undefined`.

> CS 101: Asserting means throwing and crashing if the assertion condition is not met

## `notNil()`

Type predicate for checking nil values

```tsx
import { notNil } from "@valu/assert";

function fn(text: string | null | undefined) {
    if (notNil(text)) {
        text.toUpperCase(); // ok!
    }
}
```

which is almost the same as

```tsx
function fn(text: string | null | undefined) {
    if (text) {
        text.toUpperCase(); // ok!
    }
}
```

but it will allow an empty string `""` since it is not nil.

But the most powerful feature is when it is used as a type predicate in `.filter()`:

```tsx
type Node = { value: number } | null | undefined;

const nodes: Nodes[] = [null, undefined, { value: 1 }];

nodes.filter(notNil).map((node) => {
    node.value; // ok!
});
```

**Use when mapping GraphQL node lists!**

## `assertNotNil()`

Assertion function for removing nil values.

```tsx
import { assertNotNil } from "@valu/assert";

function fn(item: { value: number } | null | undefined) {
    assertNotNil(item, "Optional custom error message");

    item.value; // ok!
}
```

**Use when in a situation where you know there cannot be a nil value**

## `assertIs()`

Assert that value is explicitly of the given type

```tsx
import { assertIs } from "@valu/assert";

function fn(item: { value: number } | boolean | null) {
    assertIs(item, false as const, "Not false");

    item; // item === false
}
```

Can be used to assert discriminated unions

```tsx
type Item =
    | {
          type: "post";
          postTitle: string;
      }
    | {
          type: "page";
          pageTitle: string;
      };

function fn(item: Item) {
    item.postTitle; // Error!
    assertIs(item.type, "post" as const);
    item.postTitle; // ok!
}

function fn2(item: Item) {
    item.pageTitle; // Error!
    assertIs(item.type, "page" as const);
    item.pageTitle; // ok!
}
```

GraphQL node connections have often types like this.

## `is()`

Same as `assertIs()` but as type guard which does not throw

```tsx
import { is } from "@valu/assert";

declare const item: { value: number } | boolean | null;

if (is(item, false as const)) {
    item; // item === false
}
```
