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
};

const fn = examples[window.location.pathname + window.location.search];

if (fn) {
    fn();
}
