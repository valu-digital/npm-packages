describe("basic trapping with single container", () => {
    beforeEach(() => {
        cy.visit("http://localhost:8080/basic.html");
    });

    it("focus is trapped into the container", () => {
        cy.getByTestId("focus")
            .click()
            .hasFocused("link")
            .tab()
            .hasFocused("input")
            .tab()
            .hasFocused("textarea")
            .tab()
            .hasFocused("exit-button")
            .tab()
            .hasFocused("link");
    });

    it("can exit trap", () => {
        cy.getByTestId("focus")
            .click()
            .getByTestId("exit-button")
            .click()
            .hasFocused("focus");
    });

    it.skip("can go backwards", () => {
        cy.get(".third")
            .focus()
            .tab({ shift: true })
            .focused()
            .should("have.class", "second");
    });
});

describe("trap with two containers", () => {
    beforeEach(() => {
        cy.visit("http://localhost:8080/multi-container.html");
    });

    it("focus jumps between containers", () => {
        cy.getByTestId("focus")
            .click()
            .hasFocused("link1")
            .log("lala")
            .tab()
            .hasFocused("link2")
            .tab()
            .hasFocused("link3")
            .tab()
            .hasFocused("link4")
            .tab()
            .hasFocused("link1");
    });
});
