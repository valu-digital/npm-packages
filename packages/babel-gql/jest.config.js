// @ts-check

/**
 * @type {import("@jest/types/build/Config").ProjectConfig}
 */
module.exports = {
    moduleFileExtensions: ["ts", "tsx", "js"],
    restoreMocks: true,
    setupFiles: ["<rootDir>/__tests__/setup.ts"],
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest",
    },
    globals: {
        "ts-jest": {
            tsConfig: "tsconfig.json",
        },
    },
    testMatch: ["**/?(*.)+(spec|test).ts?(x)"],
};
