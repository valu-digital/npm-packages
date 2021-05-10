declare namespace Cypress {
    interface Chainable {
        tab(options?: { shift?: boolean }): Chainable<Element>;
        hasFocused(testidValue: string): Chainable<Element>;
        getByTestId(testidValue: string): Chainable<Element>;
    }
}
