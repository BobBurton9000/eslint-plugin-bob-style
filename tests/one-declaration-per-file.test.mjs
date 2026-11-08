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
                'bob-style/one-declaration-per-file': 'error',
            },
        },
    ]);
}

test('allows one class declaration', () => {
    assert.equal(lintWithRule('class Candidate {}').length, 0);
});

test('allows one class expression', () => {
    assert.equal(lintWithRule('const Candidate = class {};').length, 0);
});

test('allows one interface declaration', () => {
    assert.equal(lintWithRule('interface Candidate {}').length, 0);
});

test('reports multiple class expressions', () => {
    const result = lintWithRule(
        'const First = class {}; const Second = class {};'
    );
    assert.equal(result.length, 1);
    assert.equal(result[0].ruleId, 'bob-style/one-declaration-per-file');
});

test('reports a class expression with a class declaration', () => {
    const result = lintWithRule(
        'class First {} const Second = class {};'
    );
    assert.equal(result.length, 1);
    assert.equal(result[0].ruleId, 'bob-style/one-declaration-per-file');
});

test('reports a class expression with an interface declaration', () => {
    const result = lintWithRule(
        'interface Candidate {} const Implementation = class {};'
    );
    assert.equal(result.length, 1);
    assert.equal(result[0].ruleId, 'bob-style/one-declaration-per-file');
});

test('continues to report multiple class and interface declarations', () => {
    const result = lintWithRule(
        'class First {} interface Second {} interface Third {}'
    );
    assert.equal(result.length, 1);
    assert.equal(result[0].ruleId, 'bob-style/one-declaration-per-file');
});
