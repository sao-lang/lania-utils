// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import dts from 'rollup-plugin-dts';
import fs from 'fs';
import path from 'path';
import replace from '@rollup/plugin-replace';

// Helper function to get all JavaScript files from the dist directory
function getAllFiles(dirPath, ext = '.js') {
    return fs
        .readdirSync(dirPath)
        .filter((file) => file.endsWith(ext))
        .map((file) => path.join(dirPath, file));
}

// Define the input files for Rollup
const inputFiles = getAllFiles('dist'); // Get all JavaScript files from the dist directory

export default [
    // Configuration for source files
    {
        input: inputFiles,
        output: [
            {
                dir: 'dist/cjs',
                format: 'cjs',
                entryFileNames: '[name].cjs.js',
                sourcemap: true,
                exports: 'auto', // 处理命名和默认导出
            },
            {
                dir: 'dist/esm',
                format: 'esm',
                entryFileNames: '[name].esm.js',
                sourcemap: true,
            },
        ],
        plugins: [
            resolve(),
            commonjs(),
            terser(),
            replace({
                this: 'undefined', // Adjust if necessary
                delimiters: ['', ''],
                preventAssignment: true,
            }),
        ],
        external: ['axios'],
    },
    // Configuration for type declarations
    {
        input: 'dist/types/index.d.ts',
        output: {
            file: 'dist/index.d.ts',
            format: 'esm',
        },
        plugins: [dts()],
    },
];
