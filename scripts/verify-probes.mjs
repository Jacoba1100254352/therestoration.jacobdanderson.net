import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import process from "node:process";

export function verifyProbe(body) {
	assert.deepEqual(body, { ok: true }, "Health and readiness probes must report the minimal ready payload");
}

if (import.meta.main) {
	assert.equal(process.argv.length, 4, "Provide the health and readiness response files");
	for (const file of process.argv.slice(2)) verifyProbe(JSON.parse(readFileSync(file, "utf8")));
}
