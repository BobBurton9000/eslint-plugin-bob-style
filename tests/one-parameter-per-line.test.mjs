import assert from 'node:assert/strict';
import test from 'node:test';
import { Linter } from 'eslint';
import parser from '@typescript-eslint/parser';
import bobStyle from '../dist/index.js';

function lintWithRule(code) {
    const linter = new Linter({ configType: 'flat' });

    return linter.verify(code, [
        {
            plugins: {
                'bob-style': bobStyle,
            },
            languageOptions: {
                parser,
                sourceType: 'module',
            },
            rules: {
                'bob-style/one-parameter-per-line': 'error',
            },
        },
    ]);
}

function fixWithRule(code) {
    const linter = new Linter({ configType: 'flat' });

    return linter.verifyAndFix(code, [
        {
            plugins: {
                'bob-style': bobStyle,
            },
            languageOptions: {
                parser,
                sourceType: 'module',
            },
            rules: {
                'bob-style/one-parameter-per-line': 'error',
            },
        },
    ]);
}

test('allows functions with zero or one parameter and correctly formatted lists', () => {
    const result = lintWithRule(`
function noParameters() {}
function oneParameter(value: string) {}
function multipleParameters(
    first: string,
    second: string
) {}
`);

    assert.equal(result.length, 0);
});

test('reports every supported function and TypeScript signature node', () => {
    const result = lintWithRule(`
const arrow = (first: string, second: string) => first;
function declaration(first: string, second: string) {}
const expression = function(first: string, second: string) {};
interface Contract {
    method(first: string, second: string): void;
    (first: string, second: string): void;
    new (first: string, second: string): Contract;
}
type FunctionType = (first: string, second: string) => void;
type ConstructorType = new (first: string, second: string) => Contract;
declare function declared(first: string, second: string): void;
`);

    assert.equal(result.length, 9);
    assert.ok(result.every((message) => message.ruleId === 'bob-style/one-parameter-per-line'));
});

test('fixes parameter and closing-parenthesis indentation', () => {
    const result = fixWithRule(`function calculate(first: number, second: number) { return first + second; }\n`);

    assert.equal(result.messages.length, 0);
    assert.equal(
        result.output,
        `function calculate(\n    first: number,\n    second: number\n) { return first + second; }\n`,
    );
});

test('retains a comment between parameters when creating fixes', () => {
    const result = fixWithRule(
        `function calculate(first: number, /* keep this comment */ second: number) { return first + second; }\n`,
    );

    assert.equal(result.messages.length, 1);
    assert.equal(
        result.output,
        `function calculate(\n    first: number, /* keep this comment */ second: number\n) { return first + second; }\n`,
    );
});
