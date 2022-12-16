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
            sourcemap: true,
            compact: true,
        },
    ],
    plugins: [
        typescript(),
        json(),
        terser({ format: { comments: false } }),
        commonjs({
            ignoreDynamicRequires: true,
        }),
        nodeResolve(),
    ],
} as RollupOptions;
