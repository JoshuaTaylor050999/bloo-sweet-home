import { nodeResolve } from '@rollup/plugin-node-resolve';
import postcss from 'rollup-plugin-postcss'
import { terser } from "rollup-plugin-terser";

export default {
    input: "src/main.js",
    output: {
        file: "kodi-in-progress.js",
        format: "umd",
        name: "KodiInProgress",
    },
    plugins: [
        nodeResolve(),
        postcss(),
        terser(),
    ]
};