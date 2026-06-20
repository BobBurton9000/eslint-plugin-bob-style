import assert from 'node:assert/strict';
import test from 'node:test';
import { Linter } from 'eslint';
import bobStyle from '../dist/index.js';

function lintWithRule(code) {
    const linter = new Linter({ configType: 'flat' });

    return linter.verify(code, [
        {
            plugins: {
                'bob-style': bobStyle,
            },
            languageOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
            rules: {
                'bob-style/no-exported-const-objects': 'error',
            },
        },
    ]);
}

test('reports named export of a const object', () => {
    const result = lintWithRule("export const MySuperClass = {\n    mySuperFunction: () => {}\n};\n");

    assert.equal(result.length, 1);
    assert.equal(result[0]?.ruleId, 'bob-style/no-exported-const-objects');
});

test('reports named export of a const enum-like object', () => {
    const result = lintWithRule("export const Colours = {\n    RED: 'red',\n    BLUE: 'blue'\n};\n");

    assert.equal(result.length, 1);
    assert.equal(result[0]?.ruleId, 'bob-style/no-exported-const-objects');
});

test('reports default export of an object literal', () => {
    const result = lintWithRule("export default {\n    foo: () => {}\n};\n");

    assert.equal(result.length, 1);
    assert.equal(result[0]?.ruleId, 'bob-style/no-exported-const-objects');
});

test('allows named export of a const primitive', () => {
    const result = lintWithRule("export const Foo = 42;\n");

    assert.equal(result.length, 0);
});

test('allows named export of a const with non-object initializer', () => {
    const result = lintWithRule("export const Foo = someFunction();\n");

    assert.equal(result.length, 0);
});

test('allows named export of a class', () => {
    const result = lintWithRule("export class Foo {}\n");

    assert.equal(result.length, 0);
});

test('allows named export of a function', () => {
    const result = lintWithRule("export function foo() {}\n");

    assert.equal(result.length, 0);
});

test('allows named export of a let object', () => {
    const result = lintWithRule("export let Foo = {\n    bar: () => {}\n};\n");

    assert.equal(result.length, 0);
});

test('allows named export of a var object', () => {
    const result = lintWithRule("export var Foo = {\n    bar: () => {}\n};\n");

    assert.equal(result.length, 0);
});

test('reports named export of a const class instance', () => {
    const result = lintWithRule("export const WebResourceRenderData = new WebResourceRenderDataImpl();\n");

    assert.equal(result.length, 1);
    assert.equal(result[0]?.ruleId, 'bob-style/no-exported-const-objects');
});

test('reports default export of a class instance', () => {
    const result = lintWithRule("export default new Foo();\n");

    assert.equal(result.length, 1);
    assert.equal(result[0]?.ruleId, 'bob-style/no-exported-const-objects');
});

test('reports named export of Object.freeze with object literal', () => {
    const result = lintWithRule("export const MyClass = Object.freeze({\n    myFunction: () => {}\n});\n");

    assert.equal(result.length, 1);
    assert.equal(result[0]?.ruleId, 'bob-style/no-exported-const-objects');
});

test('reports default export of Object.freeze with object literal', () => {
    const result = lintWithRule("export default Object.freeze({\n    myFunction: () => {}\n});\n");

    assert.equal(result.length, 1);
    assert.equal(result[0]?.ruleId, 'bob-style/no-exported-const-objects');
});
