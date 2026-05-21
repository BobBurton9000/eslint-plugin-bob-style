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
                'bob-style/no-import-passthrough-exports': 'error',
            },
        },
    ]);
}

test('reports direct passthrough export of an imported binding', () => {
    const result = lintWithRule("import { Foo as foo } from './Foo.js';\nexport const Bar = foo;\n");

    assert.equal(result.length, 1);
    assert.equal(result[0]?.ruleId, 'bob-style/no-import-passthrough-exports');
});

test('reports exported alias of an imported binding', () => {
    const result = lintWithRule("import { Foo } from './Foo.js';\nconst Bar = Foo;\nexport { Bar };\n");

    assert.equal(result.length, 1);
    assert.equal(result[0]?.ruleId, 'bob-style/no-import-passthrough-exports');
});

test('reports trivial object wrapper around an imported binding', () => {
    const result = lintWithRule("import { Foo } from './Foo.js';\nexport const Bar = { ...Foo, value: Foo };\n");

    assert.equal(result.length, 1);
    assert.equal(result[0]?.ruleId, 'bob-style/no-import-passthrough-exports');
});

test('allows alias exports of locally declared values', () => {
    const result = lintWithRule("class FilterEnvelopeType {}\nexport const FILTER_ENVELOPE_TYPE = FilterEnvelopeType;\n");

    assert.equal(result.length, 0);
});

test('allows exports with real local behavior', () => {
    const result = lintWithRule("import { formatter } from './formatter.js';\nexport function formatCurrency(value) {\n    return formatter.formatCurrency(value, 'GBP');\n}\n");

    assert.equal(result.length, 0);
});
