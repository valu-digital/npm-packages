import "cypress-plugin-tab";

Cypress.Commands.add("hasFocused", value => {
    return cy.focused().should("have.attr", "data-testid", value);
});

Cypress.Commands.add("getByTestId", value => {
    return cy.get(`[data-testid="${value}"]`);
});
