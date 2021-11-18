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
