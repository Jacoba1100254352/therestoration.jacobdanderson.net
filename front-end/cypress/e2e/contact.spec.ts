context("Contact recovery", () => {
	it("retains a failed draft and sends it successfully on retry", () => {
		cy.visit("/contact");
		cy.get("#name").type("Cypress Visitor");
		cy.get("#email").type("visitor@example.com");
		cy.get("#message").type("Please share more about the Restoration.");
		cy.intercept("POST", "/api/contact", {
			statusCode: 503,
			delay: 300,
			body: { ok: false, error: "Please try again later." }
		}).as("failedContact");
		cy.get('button[type="submit"]').click().should("be.disabled");
		cy.get("#message").should("have.attr", "readonly");
		cy.wait("@failedContact");
		cy.get('[role="status"]').should("contain", "Please try again later.");
		cy.get("#message").should("have.value", "Please share more about the Restoration.");
		cy.intercept("POST", "/api/contact", { statusCode: 202, body: { ok: true } }).as("successfulContact");
		cy.get('button[type="submit"]').click();
		cy.wait("@successfulContact");
		cy.get('[role="status"]').should("contain", "Message sent");
		cy.get("#message").should("have.value", "");
	});

	it("keeps native required-field validation", () => {
		cy.visit("/contact");
		cy.get('button[type="submit"]').click();
		cy.get("#name").should($input => {
			expect(($input[0] as HTMLInputElement).validity.valueMissing).to.eq(true);
		});
		cy.get('[role="status"]').should("be.empty");
	});
});
