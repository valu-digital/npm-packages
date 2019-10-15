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
    _name: "first",
    elements: document.querySelectorAll(".container"),
});

const nestedTrap = new FocusTrap({
    ...toggleActiveClass,
    _name: "nested",
    elements: document.querySelectorAll(".nested-container"),
});

const elementTrap = new FocusTrap({
    ...toggleActiveClass,
    _name: "nested-element",
    elements: document.querySelectorAll(".element-nesting"),
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

document.getElementById("element-nesting")!.addEventListener("click", () => {
    elementTrap.enable();
});

document
    .getElementById("element-nesting-back")!
    .addEventListener("click", () => {
        elementTrap.disable();
    });
