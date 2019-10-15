import tabbable from "tabbable";

interface FocusTrapOptions {
    elements: HTMLElement[] | NodeList;
}

export class FocusTrap {
    containers: {
        el: HTMLElement;
        hasFocus: boolean;
        tabbables: HTMLElement[];
    }[];

    state = {
        currentContainerIndex: null as number | null,
        shifKeyDown: false,
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
        document.addEventListener("keydown", this.handleKeyDown, false);
        document.addEventListener("keyup", this.handleKeyUp, false);
        document.addEventListener("focusin", this.handleFocusIn, false);
    }

    disable() {
        document.removeEventListener("keydown", this.handleKeyDown, false);
        document.removeEventListener("keyup", this.handleKeyUp, false);
        document.removeEventListener("focusin", this.handleFocusIn, false);
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

    handleKeyDown = (e: { keyCode: number; shiftKey: boolean }) => {
        // shift key
        if (e.shiftKey) {
            if (!this.state.shifKeyDown) {
                console.log("shifr down!");
            }
            this.state.shifKeyDown = true;
        }
    };

    handleKeyUp = (e: { keyCode: number; shiftKey: boolean }) => {
        // shift key
        if (e.shiftKey) {
            if (this.state.shifKeyDown) {
                console.log("shifr up!");
            }
            this.state.shifKeyDown = false;
        }
    };

    handleFocusIn = (e: Event) => {
        if (!(e.target instanceof Node)) {
            return;
        }

        this.updateContainerIndex(e.target);
        for (const container of this.containers) {
            if (
                container.el.contains(e.target) ||
                e.target instanceof Document
            ) {
                return;
            }
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
            nextContainer.tabbables[nextContainer.tabbables.length - 1].focus();
        } else {
            nextContainer.tabbables[0].focus();
        }
    };
}
