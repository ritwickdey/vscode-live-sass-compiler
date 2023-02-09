import { RollupOptions } from "rollup";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import json from "@rollup/plugin-json";
import commonjs from "@rollup/plugin-commonjs";

export default {
    input: "src/extension.ts",
    external: "vscode",
    output: [
        {
            file: "out/extension.js",
            format: "cjs",
            sourcemap: false,
            compact: true,
        },
    ],
    plugins: [
        typescript({ sourceMap: false }),
        json(),
        terser({ format: { comments: false } }),
        commonjs({
            ignoreDynamicRequires: true,
            sourceMap: false,
        }),
        nodeResolve(),
    ],
} as RollupOptions;
