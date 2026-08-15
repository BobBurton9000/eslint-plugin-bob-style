import assert from 'node:assert/strict';
import test from 'node:test';
import { Linter } from 'eslint';
import parser from '@typescript-eslint/parser';
import bobStyle from '../dist/index.js';

function lintWithRule(code, ruleName) {
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
                [`bob-style/${ruleName}`]: 'error',
            },
        },
    ]);
}

test('method-only-interfaces reports every prohibited interface member', () => {
    const result = lintWithRule(
        `interface Invalid {
    value: string;
    callback: () => void;
    [key: string]: unknown;
    (value: string): void;
    new (value: string): Invalid;
}`,
        'method-only-interfaces',
    );

    assert.equal(result.length, 5);
});

test('method-only-interfaces allows methods, empty interfaces, and contract extensions', () => {
    const result = lintWithRule(
        `interface Contract {
    execute(): void;
}
interface Empty {}
interface SpecialisedContract extends Contract {}`,
        'method-only-interfaces',
    );

    assert.equal(result.length, 0);
});

test('no-public-class-properties reports public, protected, and implicit instance fields', () => {
    const result = lintWithRule(
        `class Invalid {
    public visible = 1;
    protected guarded = 2;
    implicit = 3;
    public constructor(public value: string, protected count: number, readonly implicitValue: boolean, private secret: string) {}
}`,
        'no-public-class-properties',
    );

    assert.equal(result.length, 6);
});

test('no-public-class-properties reports accessor and abstract instance fields', () => {
    const result = lintWithRule(
        `abstract class Invalid {
    accessor visible = 1;
    abstract required: string;
}`,
        'no-public-class-properties',
    );

    assert.equal(result.length, 2);
});

test('no-public-class-properties allows private fields, private parameter properties, and static fields', () => {
    const result = lintWithRule(
        `class Valid {
    private value = 1;
    #secret = 2;
    static publicConstant = 3;
    public constructor(private readonly name: string) {}
}`,
        'no-public-class-properties',
    );

    assert.equal(result.length, 0);
});
