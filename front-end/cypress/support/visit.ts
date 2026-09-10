export function visitReady(url: string, options: Partial<Cypress.VisitOptions> = {}) {
	cy.visit(url, options);
	// Static HTML is visible before Vite SSG finishes loading and mounting the route.
	// Vue adds this attribute after installing the event handlers and replacing the static DOM.
	cy.get("#app").should("have.attr", "data-v-app");
}
