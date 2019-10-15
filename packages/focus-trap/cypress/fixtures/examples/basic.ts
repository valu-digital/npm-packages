import { FocusTrap } from "../../../src";

const trap = new FocusTrap({
    elements: document.querySelectorAll(".container"),
});

const nestedTrap = new FocusTrap({
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
