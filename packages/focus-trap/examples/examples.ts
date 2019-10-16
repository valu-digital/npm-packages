import { FocusTrap } from "../src";

const toggleActiveClass = {
    onAfterEnable(trap: FocusTrap) {
        for (const c of trap.containers) {
            c.el.classList.add("active");
        }
    },
    onAfterDisable(trap: FocusTrap) {
        for (const c of trap.containers) {
            c.el.classList.remove("active");
        }
    },
};

function onClick(testid: string, cb: VoidFunction) {
    document
        .querySelector(`[data-testid="${testid}"]`)!
        .addEventListener("click", cb, false);
}

const examples = {
    "/basic.html"() {
        const trap = new FocusTrap({
            ...toggleActiveClass,
            _name: "first",
            elements: document.querySelectorAll(".container"),
        });

        onClick("focus", () => {
            trap.enable();
        });

        onClick("exit-button", () => {
            trap.disable();
        });
    },
    "/multi-container.html"() {
        const trap = new FocusTrap({
            ...toggleActiveClass,
            _name: "first",
            elements: document.querySelectorAll(".container"),
        });
        onClick("focus", () => {
            trap.enable();
        });
    },

    "/nested-traps.html"() {
        const trap1 = new FocusTrap({
            ...toggleActiveClass,
            outsideClickDisables: true,
            elements: document.querySelectorAll(".first-group"),
        });

        const trap2 = new FocusTrap({
            ...toggleActiveClass,
            outsideClickDisables: true,
            elements: document.querySelectorAll(".second-group"),
        });

        const trap3 = new FocusTrap({
            ...toggleActiveClass,
            outsideClickDisables: true,
            elements: document.querySelectorAll(".third-group"),
        });

        onClick("focus-first", () => {
            trap1.enable();
        });

        onClick("disable-first", () => {
            trap1.disable();
        });

        onClick("focus-second", () => {
            trap2.enable();
        });

        onClick("disable-second", () => {
            trap2.disable();
        });

        onClick("focus-third", () => {
            trap3.enable();
        });

        onClick("disable-third", () => {
            trap3.disable();
        });
    },
};

const fn = examples[window.location.pathname + window.location.search];

if (fn) {
    fn();
}
