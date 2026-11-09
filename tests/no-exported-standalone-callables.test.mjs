import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { Linter } from 'eslint';
import parser from '@typescript-eslint/parser';
import bobStyle from '../dist/index.js';

const fixturesDirectory = path.join(process.cwd(), 'tests/fixtures/no-exported-standalone-callables');

function lintWithRule(code, parserOptions = {}) {
    const linter = new Linter({ configType: 'flat' });

    return linter.verify(code, [
        {
            plugins: {
                'bob-style': bobStyle,
            },
            languageOptions: {
                parser,
                parserOptions,
                sourceType: 'module',
            },
            rules: {
                'bob-style/no-exported-standalone-callables': 'error',
            },
        },
    ]);
}

async function lintFixture(filename) {
    const filePath = path.join(fixturesDirectory, filename);
    const code = await readFile(filePath, 'utf8');
    const linter = new Linter({ configType: 'flat' });

    return linter.verify(
        code,
        [
            {
                files: ['**/*.ts'],
                plugins: {
                    'bob-style': bobStyle,
                },
                languageOptions: {
                    parser,
                    parserOptions: {
                        project: path.join(fixturesDirectory, 'tsconfig.json'),
                        tsconfigRootDir: process.cwd(),
                    },
                    sourceType: 'module',
                },
                rules: {
                    'bob-style/no-exported-standalone-callables': 'error',
                },
            },
        ],
        filePath,
    );
}

test('reports directly exported callable declarations', () => {
    const result = lintWithRule('export function direct() {}\nexport const arrow = () => {};');

    assert.equal(result.length, 2);
    assert.ok(result.every((message) => message.ruleId === 'bob-style/no-exported-standalone-callables'));
});

test('reports locally declared callables exported through named specifiers only', () => {
    const result = lintWithRule(`
function first() {}
const second = () => {};
const value = 1;
class Model {}
type CallableContract = () => void;
export { first as renamedFirst, second, value, Model, type first, type CallableContract };
export type { first };
`);

    assert.equal(result.length, 2);
    assert.ok(result.every((message) => message.nodeType === 'ExportSpecifier'));
    assert.deepEqual(result.map((message) => message.line), [7, 7]);
});

test('reports callable source re-exports when TypeScript type information is available', async () => {
    const result = await lintFixture('named-reexports.ts');

    assert.equal(result.length, 2);
    assert.ok(result.every((message) => message.ruleId === 'bob-style/no-exported-standalone-callables'));
});

test('reports callable exports from export-star when TypeScript can identify them', async () => {
    const result = await lintFixture('star-reexports.ts');

    assert.equal(result.length, 1);
    assert.equal(result[0]?.ruleId, 'bob-style/no-exported-standalone-callables');
});

test('does not report source re-exports when callable status cannot be reliably established', () => {
    const result = lintWithRule("export { unknown } from './unknown-module.js';");

    assert.equal(result.length, 0);
});

test('does not report export-star when callable status cannot be reliably established', () => {
    const result = lintWithRule("export * from './unknown-module.js';");

    assert.equal(result.length, 0);
});
