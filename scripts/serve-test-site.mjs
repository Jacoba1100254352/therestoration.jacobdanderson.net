import { resolve } from "node:path";
import process from "node:process";
// eslint-disable-next-line antfu/no-import-dist -- Browser tests must exercise the production server build.
import { createApp } from "../back-end/dist/app.js";

// Exercise the built production app without loading environment files or enabling SMTP.
const app = createApp({ staticRoot: resolve(import.meta.dirname, "../front-end/dist") });
const server = app.listen(3333, "127.0.0.1", () => {
	console.log("Production test server: http://127.0.0.1:3333");
});
for (const signal of ["SIGTERM", "SIGINT"]) {
	process.once(signal, () => server.close());
}
