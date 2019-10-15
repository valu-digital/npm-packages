import { FocusTrap } from "../../../src";

const trap = new FocusTrap({
    elements: document.querySelectorAll(".container1,.container2"),
});

trap.enable();
