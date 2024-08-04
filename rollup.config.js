// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import dts from 'rollup-plugin-dts';
import fs from 'fs';
import path from 'path';
import copy from 'rollup-plugin-copy';

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
                exports: 'auto', // 处理命名和默认导出
            },
            {
                dir: 'dist/esm',
                format: 'esm',
                entryFileNames: '[name].esm.js',
            },
        ],
        plugins: [
            resolve(),
            commonjs(),
            terser(),
            copy({
                targets: [
                    { src: 'src/message.css', dest: 'dist' }, // 替换为你的 CSS 文件路径
                ],
            }),
        ],
        context: 'this', // Add this line to set the correct context
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
