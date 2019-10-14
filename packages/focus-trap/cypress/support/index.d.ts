declare namespace Cypress {
    interface Chainable {
        tab(options?: { shift?: boolean }): Chainable<Element>;
    }
}
