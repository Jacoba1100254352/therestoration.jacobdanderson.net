import type { UserModule } from "~/types";
import { nextTick } from "vue";

export const install: UserModule = ({ isClient, router }) => {
	if (!isClient) return;
	router.afterEach(async (to, from, failure) => {
		if (failure || !from.matched.length || to.path === from.path) return;
		await nextTick();
		document.querySelector<HTMLElement>("main")?.focus({ preventScroll: true });
	});
};
