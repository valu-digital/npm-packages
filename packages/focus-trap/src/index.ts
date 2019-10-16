import tabbable, { isTabbable } from "tabbable";

function getTabbables(el: HTMLElement) {
    const tabbables = tabbable(el);

    if (tabbables.length === 0) {
        if (isTabbable(el)) {
            return [el];
        }
        return null;
    }

    return tabbables;
}

interface FocusTrapOptions {
    _name?: string;
    containers: HTMLElement[] | NodeList | HTMLElement | null | undefined;

    outsideClickDisables?: boolean;

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
     * Executed after the trap has been disabled
     */
    onAfterDisable?(trap: FocusTrap): void;
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

    /**
     * Element that had focus before the trap was enabled
     */
    elementBeforeTrap?: HTMLElement;

    containers: HTMLElement[];

    private state = {
        active: false,
        currentContainerIndex: null as number | null,
        shifKeyDown: false,
        usingMouse: false,
    };

    private options: FocusTrapOptions;

    constructor(options: FocusTrapOptions) {
        this.options = options;
        let elements;

        if (options.containers instanceof NodeList) {
            elements = Array.from(options.containers) as HTMLElement[];
        } else if (options.containers instanceof HTMLElement) {
            elements = [options.containers];
        } else if (!options.containers) {
            elements = [] as HTMLElement[];
        } else {
            elements = options.containers;
        }

        if (elements.length === 0) {
            console.warn("No elements passed to FocusTrap");
        }

        this.containers = elements;
    }

    isEnabled() {
        return this.state.active;
    }

    /**
     * Enable trap
     */
    enable() {
        if (this.options.onBeforeEnable) {
            this.options.onBeforeEnable(this);
        }

        if (document.activeElement instanceof HTMLElement) {
            this.elementBeforeTrap = document.activeElement || undefined;
        }

        if (FocusTrap.current) {
            const parent = FocusTrap.current;
            FocusTrap.current.disable({ ignoreParent: true });
            this.parent = parent;
        }

        FocusTrap.current = this;

        document.addEventListener("keydown", this.handlers.keyDown, false);
        document.addEventListener("keyup", this.handlers.keyUp, false);
        document.addEventListener("focusin", this.handlers.focusIn, false);

        document.addEventListener("mousedown", this.handlers.mouseDown, false);
        document.addEventListener("mouseup", this.handlers.mouseUp, false);

        this.state.active = true;

        if (this.lastFocusedElement) {
            this.lastFocusedElement.focus();
        } else {
            this.focusFirst();
        }

        if (this.options.onAfterEnable) {
            this.options.onAfterEnable(this);
        }
    }

    /**
     * Disable trap
     */
    disable(options?: { ignoreParent?: boolean }) {
        if (!this.isEnabled()) {
            return;
        }

        if (FocusTrap.current !== this) {
            console.warn("Not currently active focus-trap, cannot disable");
            return;
        }

        if (this.options.onBeforeDisable) {
            this.options.onBeforeDisable(this);
        }

        document.removeEventListener("keydown", this.handlers.keyDown, false);
        document.removeEventListener("keyup", this.handlers.keyUp, false);
        document.removeEventListener("focusin", this.handlers.focusIn, false);

        this.state.active = false;
        FocusTrap.current = undefined;

        if (this.options.onAfterDisable) {
            this.options.onAfterDisable(this);
        }

        const skipParent = options && options.ignoreParent;
        if (!skipParent && this.parent) {
            this.parent.enable();
            this.parent = undefined;
        } else if (this.elementBeforeTrap) {
            this.elementBeforeTrap.focus();
        }
    }

    /**
     * Focus first tabbable element from the first container
     */
    focusFirst() {
        const container = this.containers[0];
        const tabbables = getTabbables(container);
        if (tabbables) {
            tabbables[0].focus();
        }
    }

    /**
     * Update currently active trap container index
     */
    updateContainerIndex(nextElement: Node) {
        let nextIndex = this.containers.findIndex(container =>
            container.contains(nextElement),
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
            if (container.contains(el)) {
                return true;
            }
        }

        return false;
    }

    handlers = {
        mouseDown: (e: Event) => {
            if (!(e.target instanceof HTMLElement)) {
                return;
            }

            if (!this.isInContainers(e.target)) {
                this.state.usingMouse = true;

                if (this.options.outsideClickDisables) {
                    this.disable();
                }
            }
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
                this.lastFocusedElement = prev;
                prev.focus();
                return;
            }

            e.stopImmediatePropagation();

            let nextContainerIndex = 1;

            // Shift+tab moves focus backwards
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
                const tabbables = getTabbables(nextContainer);
                if (tabbables) {
                    tabbables[tabbables.length - 1].focus();
                }
            } else {
                const tabbables = getTabbables(nextContainer);
                if (tabbables) {
                    tabbables[0].focus();
                }
            }
        },
    };
}
