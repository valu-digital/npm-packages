import dedent from "dedent";
import { promises as fs } from "fs";
import { isDir, logger } from "./utils";

export async function initSakkePlugin(argv: string[]) {
    const name = argv[0];

    if (!name) {
        logger.error("init-plugin requires name argument");
        return 1;
    }

    const dir = `sakke-plugins/${name}`;

    if (await isDir(dir)) {
        logger.error("Plugin already exist");
        return 4;
    }

    await fs.mkdir(`sakke-plugins/${name}`, { recursive: true });

    await fs.writeFile(
        dir + "/index.php",
        dedent`<?php
        // This file loaded when when the plugin activates
	    `,
    );

    await fs.writeFile(
        dir + "/index.js",
        dedent`
            export default () => {
                // This function is executed on the frontend
                // when the plugin is active
            };
	    `,
    );

    await fs.writeFile(
        dir + "/admin.js",
        dedent`
            export default () => {
                // This function is executed on the wp-admin
                // pages when the plugin is active
            };
	    `,
    );

    await fs.writeFile(
        dir + "/gutenberg.js",
        dedent`
            export default () => {
                // This function is executed with the Gutenberg
                // editor when the plugin is active
            };
	    `,
    );
}
