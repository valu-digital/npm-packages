import { FocusTrap } from "../../../src";

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

const trap = new FocusTrap({
    ...toggleActiveClass,
    elements: document.querySelectorAll(".container"),
});

const nestedTrap = new FocusTrap({
    ...toggleActiveClass,
    elements: document.querySelectorAll(".nested-container"),
});

trap.enable();

document.getElementById("ding")!.addEventListener("click", () => {
    alert("ding");
});

document.getElementById("disable")!.addEventListener("click", () => {
    trap.disable();
});

document.getElementById("enable")!.addEventListener("click", () => {
    trap.enable();
});

document.getElementById("nest")!.addEventListener("click", () => {
    nestedTrap.enable();
});

document.getElementById("next")!.addEventListener("click", () => {
    nestedTrap.enable();
});

document.getElementById("back")!.addEventListener("click", () => {
    trap.enable();
});
