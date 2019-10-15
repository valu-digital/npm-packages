import tabbable from "tabbable";

interface FocusTrapOptions {
    elements: HTMLElement[] | NodeList;
}

export class FocusTrap {
    static current?: FocusTrap;
    parent?: FocusTrap;
    lastFocusedElement?: HTMLElement;

    containers: {
        el: HTMLElement;
        hasFocus: boolean;
        tabbables: HTMLElement[];
    }[];

    state = {
        currentContainerIndex: null as number | null,
        shifKeyDown: false,
        usingMouse: false,
    };

    constructor(options: FocusTrapOptions) {
        let elements;

        if (!Array.isArray(options.elements)) {
            elements = Array.from(options.elements) as HTMLElement[];
        } else {
            elements = options.elements;
        }

        this.containers = elements.map(el => {
            return {
                el,
                hasFocus: false,
                tabbables: tabbable(el),
            };
        });
    }

    enable() {
        if (FocusTrap.current) {
            FocusTrap.current.disable();
            this.parent = FocusTrap.current;
        }

        FocusTrap.current = this;

        document.addEventListener("keydown", this.handlers.keyDown, false);
        document.addEventListener("keyup", this.handlers.keyUp, false);
        document.addEventListener("focusin", this.handlers.focusIn, false);

        document.addEventListener("mousedown", this.handlers.mouseDown, false);
        document.addEventListener("mouseup", this.handlers.mouseUp, false);

        if (this.lastFocusedElement) {
            this.lastFocusedElement.focus();
        } else {
            this.focusFirst();
        }
    }

    disable() {
        if (FocusTrap.current !== this) {
            console.warn("Not currently active focus-trap, cannot disable");
            return;
        }
        document.removeEventListener("keydown", this.handlers.keyDown, false);
        document.removeEventListener("keyup", this.handlers.keyUp, false);
        document.removeEventListener("focusin", this.handlers.focusIn, false);
        FocusTrap.current = undefined;
        if (this.parent) {
            this.parent.enable();
            this.parent = undefined;
        }
    }

    focusFirst() {
        const el = this.containers[0].tabbables[0];
        el.focus();
    }

    updateContainerIndex(nextElement: Node) {
        setTimeout(() => {
            if (nextElement === document.activeElement) {
                let nextIndex = this.containers.findIndex(container =>
                    container.el.contains(nextElement),
                );
                if (nextIndex !== -1) {
                    this.state.currentContainerIndex = nextIndex;
                }
            }
        }, 1);
    }

    isInContainers(el: HTMLElement) {
        for (const container of this.containers) {
            if (container.el.contains(el)) {
                return true;
            }
        }

        return false;
    }

    handlers = {
        mouseDown: () => {
            this.state.usingMouse = true;
        },
        mouseUp: () => {
            this.state.usingMouse = false;
        },

        keyDown: (e: { keyCode: number; shiftKey: boolean }) => {
            if (e.shiftKey) {
                this.state.shifKeyDown = true;
            }
        },

        keyUp: (e: { keyCode: number; shiftKey: boolean }) => {
            if (e.shiftKey) {
                this.state.shifKeyDown = false;
            }
        },
        focusIn: (e: Event) => {
            if (!(e.target instanceof HTMLElement)) {
                return;
            }

            const prev = this.lastFocusedElement;

            if (document.activeElement instanceof HTMLElement) {
                this.lastFocusedElement = document.activeElement;
            }

            this.updateContainerIndex(e.target);

            if (this.isInContainers(e.target)) {
                return;
            }

            if (this.state.usingMouse && prev) {
                prev.focus();
                return;
            }

            e.stopImmediatePropagation();

            let nextIndex = 1;

            const direction = this.state.shifKeyDown ? -1 : 1;

            if (this.state.currentContainerIndex !== null) {
                nextIndex =
                    (this.state.currentContainerIndex + direction) %
                    this.containers.length;
            }

            const nextContainer = this.containers[nextIndex];

            if (this.state.shifKeyDown) {
                const el =
                    nextContainer.tabbables[nextContainer.tabbables.length - 1];
                el.focus();
            } else {
                const el = nextContainer.tabbables[0];
                el.focus();
            }
        },
    };
}
