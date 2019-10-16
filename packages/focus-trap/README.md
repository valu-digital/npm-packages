# Multicontainer Focus Trap

Like [davidtheclark/focus-trap][] but can trap focus to multiple containers
at once and is maintained.

[davidtheclark/focus-trap]: https://github.com/davidtheclark/focus-trap

See demos here <http://valu-focus-trap.netlify.com>

## Installation

    npm install @valu/focus-trap

## Usage

```ts
import { FocusTrap } from "@valu/focus-trap";

const trap = new FocusTraps({
    elements: document.querySelectorAll(".container"),
});

trap.enable();

document.querySelector("button#disable").addEventListener(() => {
    trap.disable();
});
```
