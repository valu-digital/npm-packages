import { FocusTrap } from "../../../src";

const trap = new FocusTrap({
    elements: document.querySelectorAll(".container1,.container2"),
});

const nestedTrap = new FocusTrap({
    elements: document.querySelectorAll(
        ".nested-container1,.nested-container2",
    ),
});

trap.enable();

document.getElementById("disable")!.addEventListener("click", () => {
    trap.disable();
});

document.getElementById("enable")!.addEventListener("click", () => {
    trap.enable();
});

document.getElementById("nest")!.addEventListener("click", () => {
    nestedTrap.enable();
});
