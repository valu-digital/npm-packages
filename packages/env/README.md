# `@valu/env`

Tiny helper for managing enviroment variables type safely.

## Install

```
npm install @valu/env
```

## Usage

```ts
import { TypedEnv } from "@valu/env";

type AllowedKeys = "FOO" | "BAR";

const env = new TypedEnv<AllowedKeys>(process.env);
```

Reading

```ts
// Get value in FOO env. Throws if FOO is not defined. The return type is always
// `string`.
const value = env.get("FOO");

// Type error
const value = env.get("WAT");

// Second argument can be used for default values to avoid throwing.
const value = env.get("FOO", "default");

// Use null as the default the get return value of `string | null` without
// throwing
const value = env.get("FOO", null);
```

Mutation

```ts
// Set env var
env.set("FOO", "value");

// Delete env var
env.delete("FOO");
```
