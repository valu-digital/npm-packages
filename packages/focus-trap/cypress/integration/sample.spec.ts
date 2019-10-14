describe("basic trapping with two containers", () => {
    it("can skip input not in a trapped container", () => {
        cy.visit("http://localhost:8080/basic.html");
        cy.get(".first")
            .focus()
            .tab()
            .tab()
            .focused()
            .should("have.class", "third");
    });

    it("can go backwards", () => {
        cy.visit("http://localhost:8080/basic.html");
        cy.get(".third")
            .focus()
            .tab({ shift: true })
            .tab({ shift: true })
            .focused()
            .should("have.class", "first");
    });

    // it("sdffds", () => {
    //     cy.visit("http://localhost:8080/basic.html");
    //     cy.get(".first")
    //         .focus()
    //         .tab()
    //         .tab()
    //         .tab()
    //         .tab()
    //         .focused()
    //         .should("have.class", "first");
    // });
});
