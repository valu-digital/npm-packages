import tabbable from "tabbable";

interface FocusTrapOptions {
    elements: HTMLElement[] | NodeList;
}

export class FocusTrap {
    /**
     * The currently active FocusTrap instance
     */
    static current?: FocusTrap;

    /**
     * Reference to the previously enabled focus trap when nesting traps
     */
    parent?: FocusTrap;

    /**
     * Element this focus trap had focus on most recently
     */
    lastFocusedElement?: HTMLElement;

    containers: {
        el: HTMLElement;
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
                tabbables: tabbable(el),
            };
        });
    }

    /**
     * Enable trap
     */
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

    /**
     * Disable trap
     */
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

    /**
     * Focus first tabbable element from the first container
     */
    focusFirst() {
        const el = this.containers[0].tabbables[0];
        el.focus();
    }

    /**
     * Update currently active trap container index
     */
    updateContainerIndex(nextElement: Node) {
        let nextIndex = this.containers.findIndex(container =>
            container.el.contains(nextElement),
        );
        if (nextIndex !== -1) {
            this.state.currentContainerIndex = nextIndex;
        }
    }

    /**
     * Is element inside one of the containers
     */
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

            /**
             * Last focused element
             */
            const prev = this.lastFocusedElement;

            // Update lastly focused element
            if (document.activeElement instanceof HTMLElement) {
                this.lastFocusedElement = document.activeElement;
            }

            this.updateContainerIndex(e.target);

            // Focus still inside our containers. Nothing to do.
            if (this.isInContainers(e.target)) {
                return;
            }

            // If focus change was done using mouse revert back to the previous element
            if (this.state.usingMouse && prev) {
                prev.focus();
                return;
            }

            e.stopImmediatePropagation();

            let nextContainerIndex = 1;

            // Shift+tab move focus backwards
            const direction = this.state.shifKeyDown ? -1 : 1;

            if (this.state.currentContainerIndex !== null) {
                nextContainerIndex =
                    (this.state.currentContainerIndex + direction) %
                    this.containers.length;
            }

            // When backwards from first container
            if (nextContainerIndex === -1) {
                // last container index
                nextContainerIndex = this.containers.length - 1;
            }

            const nextContainer = this.containers[nextContainerIndex];

            // If going backwards select last tabbable from the new container
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
