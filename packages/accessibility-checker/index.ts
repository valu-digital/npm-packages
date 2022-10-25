import AxeBuilder from "@axe-core/playwright";
import { webkit } from "playwright";

export async function analyze(url: string) {
    const browser = await webkit.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(url);

    const analysis = await new AxeBuilder({ page })
        .withTags([
            "wcag2a",
            "wcag2aa",
            "wcag21a",
            "wcag21aa",
            "best-practice",
            "ACT",
        ])
        .analyze();

    await browser.close();

    return analysis.violations;
}
