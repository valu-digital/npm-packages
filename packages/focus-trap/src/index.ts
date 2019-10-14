import tabbable from "tabbable";

export function createTrap(elements: HTMLElement[] | NodeList) {
    if (!Array.isArray(elements)) {
        elements = Array.from(elements) as HTMLElement[];
    }

    const state = {
        currentContainerIndex: null as number | null,
        shifKeyDown: false,
    };

    function shiftKeyDownMonitor(e: any) {
        if (e.keyCode === 16) {
            state.shifKeyDown = true;
        }
    }

    function shiftKeyUpMonitor(e: any) {
        if (e.keyCode === 16) {
            state.shifKeyDown = false;
        }
    }

    document.addEventListener("keydown", shiftKeyDownMonitor, false);
    document.addEventListener("keyup", shiftKeyUpMonitor, false);

    const containers = elements.map(el => {
        return {
            el,
            hasFocus: false,
            tabbables: tabbable(el),
        };
    });

    function updateCurrent(e: any) {
        setTimeout(() => {
            if (e.target === document.activeElement) {
                let nextIndex = containers.findIndex(container =>
                    container.el.contains(e.target),
                );
                if (nextIndex !== -1) {
                    state.currentContainerIndex = nextIndex;
                }
            }
        }, 1);
    }

    document.addEventListener("focusin", (e: any) => {
        updateCurrent(e);
        for (const container of containers) {
            if (
                container.el.contains(e.target) ||
                e.target instanceof Document
            ) {
                return;
            }
        }

        e.stopImmediatePropagation();

        let nextIndex = 1;

        if (state.currentContainerIndex !== null) {
            nextIndex = (state.currentContainerIndex + 1) % containers.length;
        }

        const nextContainer = containers[nextIndex];

        console.log("Sending to next trap", nextContainer.el);
        nextContainer.tabbables[0].focus();
    });
}
