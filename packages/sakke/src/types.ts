import { z } from "zod";

const anyFn = () => z.function().args(z.any()).returns(z.any());

export const SakkeConfigParser = z
    .object({
        babelPlugins: z
            .array(z.union([z.string(), z.array(z.string()), anyFn()]))
            .optional(),

        webpackPlugins: z.array(z.any()).optional(),
        webpackRules: z.array(z.any()).optional(),
        compileNodeModules: z.array(z.string()).optional(),
        customizeBabelOptions: anyFn().optional(),

        env: z.record(z.string()).optional(),

        productionSourceMaps: z.boolean().optional(),
    })
    .strict();

export type SakkeConfig = z.infer<typeof SakkeConfigParser>;

export const SakkeJSON = z.object({
    webpack: z.object({
        port: z.number(),
        host: z.string(),
    }),
});

export type SakkeJSONType = z.infer<typeof SakkeJSON>;
