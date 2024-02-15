import { promises } from "fs";
import { expect, test } from "@playwright/test";
import { analyze } from "..";

const TEST_REPORT = "test-report.json";

test.beforeAll(async () => {
    promises.rm(TEST_REPORT, { force: true });
});

test("can analyze page and write report", async () => {
    const res = await analyze(
        "http://localhost:8000/test-fixtures/inaccessible.html",
    );
    await promises.appendFile(TEST_REPORT, JSON.stringify(res));

    const file = await promises.readFile(TEST_REPORT);
    expect(file.toString().length).toBeGreaterThan(1);
});
