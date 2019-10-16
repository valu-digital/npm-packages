describe("basic trapping with single container", () => {
    it("focus is trapped into the container", () => {
        cy.visit("http://localhost:8080/basic.html");
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
            .hasFocused("link")
            // Hook test
            .get(".container")
            .should("have.class", "active");
    });

    it("can exit trap", () => {
        cy.visit("http://localhost:8080/basic.html");
        cy.getByTestId("focus")
            .click()
            .getByTestId("exit-button")
            .click()
            .hasFocused("focus")
            // hook test
            .get(".container")
            .should("not.have.class", "active");
    });

    it("can use outside click to exit  ", () => {
        cy.visit("http://localhost:8080/basic.html?outsideClick");
        cy.getByTestId("focus")
            .click()
            .getByTestId("title")
            .click()
            .get("body")
            .tab()
            .hasFocused("outside-input-before1");
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
            .tab()
            .hasFocused("link2")
            .tab()
            .hasFocused("link3")
            .tab()
            .hasFocused("link4")
            .tab();
    });

    it("can go backwards", () => {
        cy.getByTestId("focus")
            .click()
            .hasFocused("link1")
            .tab()
            .hasFocused("link2")
            .tab()
            .hasFocused("link3")
            .tab({ shift: true })
            .hasFocused("link2")
            .tab();
    });

    it("can go backwards from first", () => {
        cy.getByTestId("focus")
            .click()
            .hasFocused("link1")
            .tab({ shift: true })
            .hasFocused("link4");
    });
});

describe("nested traps", () => {
    beforeEach(() => {
        cy.visit("http://localhost:8080/nested-traps.html");
    });

    it("can use disable to go back to previous traps", () => {
        cy.getByTestId("focus-first")
            .click()
            .hasFocused("first-link1")
            .getByTestId("focus-second")
            .click()
            .hasFocused("second-link1")
            .getByTestId("focus-third")
            .click()
            .hasFocused("third-link1")
            .getByTestId("disable-third")
            .click()
            .hasFocused("focus-third")
            .getByTestId("disable-second")
            .click()
            .hasFocused("focus-second");
    });
});
