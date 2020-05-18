# Multi-Container Focus Trap

Like [davidtheclark/focus-trap][] but can trap focus to multiple containers
at once and is maintained.

[davidtheclark/focus-trap]: https://github.com/davidtheclark/focus-trap

## Features

-   Focus can move between different focus roots (containers)
-   Nested traps
-   Automatic deactivation by outside click or escape (optional)
-   Container can be itself be focusable element
-   Build-in types (written in TypeScript)

See demos here <http://valu-focus-trap.netlify.com>

## Installation

    npm install @valu/focus-trap

## Usage

```ts
import { FocusTrap } from "@valu/focus-trap";

const trap = new FocusTrap({
    containers: document.querySelectorAll(".container"),
});

trap.enable();

document.querySelector("button#disable").addEventListener(() => {
    trap.disable();
});
```

## Options

The `FocusTrap` constructor takes following options object

```ts
interface FocusTrapOptions {
    containers: HTMLElement | HTMLElement[] | NodeList | null | undefined;

    /**
     * Disable the trap when user click an element outside of the selected
     * containers
     */
    outsideClickDisables?: boolean;

    /**
     * Disable the trap when user hits escape key
     */
    escDisables?: boolean;

    /**
     * Executed before trap enables
     */
    onBeforeEnable?(trap: FocusTrap): void;

    /**
     * Executed after the trap has been enabled
     */
    onBeforeDisable?(trap: FocusTrap): void;

    /**
     * Execute before the trap gets disabled
     */
    onAfterEnable?(trap: FocusTrap): void;

    /**
     * Executed after the trap has been disabled. By default the focus trap
     * restores focus to the element that had the focus before trap activation.
     * This hook can used to focus some other element manually.
     */
    onAfterDisable?(trap: FocusTrap): void;

    /**
     * Filter out tabbables from containers
     */
    filterTabbables?(tabbables: HTMLElement[], trap: FocusTrap): HTMLElement[];
}
```
