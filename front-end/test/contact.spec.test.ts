import { createApp, nextTick } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import Contact from "../src/pages/contact.vue";

let dispose: (() => void) | undefined;
async function mountForm() {
	const root = document.createElement("div");
	document.body.append(root);
	const app = createApp(Contact);
	app.mount(root);
	dispose = () => {
		app.unmount();
		root.remove();
	};
	for (const [id, value] of Object.entries({
		name: "Test Visitor",
		email: "visitor@example.com",
		message: "A useful message for the site."
	})) {
		const field = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${id}`)!;
		field.value = value;
		field.dispatchEvent(new Event("input", { bubbles: true }));
	}
	await nextTick();
	return root;
}
function submit(root: HTMLElement) {
	root.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
}

afterEach(() => {
	dispose?.();
	vi.unstubAllGlobals();
});

describe("contact submission", () => {
	it.each([
		["HTML success response", new Response("<html>Unavailable</html>", { status: 200 })],
		["empty success response", new Response(null, { status: 204 })],
		["rejected success payload", Response.json({ ok: false })],
		["unavailable mail", Response.json({ ok: false, error: "Please try later." }, { status: 503 })]
	])("preserves the draft for %s", async (_label, response) => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
		const root = await mountForm();
		submit(root);
		await vi.waitFor(() => expect(root.querySelector(".form-response--error")?.textContent).toBeTruthy());
		expect(root.querySelector<HTMLInputElement>("#name")!.value).toBe("Test Visitor");
		expect(root.querySelector<HTMLTextAreaElement>("#message")!.value).toBe("A useful message for the site.");
		expect(root.querySelector<HTMLButtonElement>("button")!.disabled).toBe(false);
	});

	it.each([new TypeError("Failed to fetch"), new DOMException("Timed out", "TimeoutError")])(
		"retains the draft after a network failure: %s",
		async error => {
			vi.stubGlobal("fetch", vi.fn().mockRejectedValue(error));
			const root = await mountForm();
			submit(root);
			await vi.waitFor(() => expect(root.querySelector(".form-response--error")?.textContent).toBeTruthy());
			expect(root.querySelector<HTMLTextAreaElement>("#message")!.value).toBe("A useful message for the site.");
			if (error.name === "TimeoutError") expect(root.textContent).toContain("Delivery could not be confirmed");
		}
	);

	it("sends once, protects the submitted draft, and clears it only on confirmation", async () => {
		let confirm!: (response: Response) => void;
		const fetchMock = vi.fn(
			() =>
				new Promise<Response>(resolve => {
					confirm = resolve;
				})
		);
		vi.stubGlobal("fetch", fetchMock);
		const root = await mountForm();
		expect(root.querySelector('[role="status"]')?.textContent).toBe("");
		submit(root);
		submit(root);
		await nextTick();
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(root.querySelector<HTMLInputElement>("#name")!.readOnly).toBe(true);
		expect(root.querySelector<HTMLTextAreaElement>("#message")!.readOnly).toBe(true);
		expect(root.querySelector<HTMLButtonElement>("button")!.disabled).toBe(true);
		confirm(Response.json({ ok: true }, { status: 202 }));
		await vi.waitFor(() => expect(root.textContent).toContain("Message sent"));
		expect(root.querySelector<HTMLInputElement>("#name")!.value).toBe("");
		expect(root.querySelector<HTMLTextAreaElement>("#message")!.value).toBe("");
	});
});
