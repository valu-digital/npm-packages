import PathUtils from "path";
import { promises as fs } from "fs";
import { SakkeJSON, SakkeJSONType } from "./types";

export const logger = {
    info(...args: any[]) {
        console.log("[sakke]", ...args);
    },

    ok(...args: any[]) {
        console.log("[sakke ✅ ]", ...args);
    },

    error(...args: any[]) {
        console.error("[sakke Error ❌ ]", ...args);
    },

    warn(...args: any[]) {
        console.warn("[sakke Warn 🖐️ ️]", ...args);
    },
};

export async function isFile(path: string) {
    return fs.stat(path).then(
        (stat) => stat.isFile(),
        () => false, // "try-catch" error on missing files etc.
    );
}

export async function loadSakkeJSON(): Promise<SakkeJSONType> {
    const data = await fs
        .readFile(PathUtils.join(process.cwd(), "sakke.json"))
        .catch((error) => {
            if (error.code !== "ENOENT") {
                throw error;
            }
        });

    if (!data) {
        logger.warn("No sakke.json found. Generating some defaults.");
        return {
            webpack: {
                port: 3941,
                host: "localhost",
            },
        };
    }

    return SakkeJSON.parse(JSON.parse(data.toString()));
}
