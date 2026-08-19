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

test('no-intersection-type-annotations reports direct and nested property annotations', () => {
    const result = lintWithRule(
        `class Candidate {
    private direct: First & Second;
    private nested: ReadonlyArray<First & Second>;
    private callback: (value: First & Second) => void;
}
interface CandidateContract {
    member: First & Second;
}
type CandidateShape = {
    member: First & Second;
};
abstract class AbstractCandidate {
    abstract value: First & Second;
    accessor cached: First & Second;
    abstract accessor observed: First & Second;
}
type Indexed = { [key: string]: First & Second; };
type Mapped = { [Key in First]: Second & Third; };`,
        'no-intersection-type-annotations',
    );

    assert.equal(result.length, 10);
    assert.ok(result.every((message) => message.ruleId === 'bob-style/no-intersection-type-annotations'));
    assert.deepEqual(result.map((message) => message.line), [2, 3, 4, 7, 10, 13, 14, 15, 17, 18]);
});

test('no-intersection-type-annotations reports function-like parameter annotations', () => {
    const result = lintWithRule(
        `function declared(value: First & Second): void {}
const expression = function(value: First & Second): void {};
const arrow = (value: First & Second): void => {};
class Candidate {
    public constructor(private readonly value: First & Second) {}
    public update(value: ReadonlyArray<First & Second>): void {}
}
interface CandidateContract {
    update(value: First & Second): void;
}
type Callback = (value: First & Second) => void;
declare function ambient(value: First & Second): void;
function assertedCallback(value = {} as ((argument: First & Second) => void)): void {}`,
        'no-intersection-type-annotations',
    );

    assert.equal(result.length, 9);
    assert.ok(result.every((message) => message.ruleId === 'bob-style/no-intersection-type-annotations'));
});

test('no-intersection-type-annotations allows return and local type annotations', () => {
    const result = lintWithRule(
        `const local: First & Second = {} as First & Second;
type Combined = First & Second;
const callback: () => First & Second = () => local;
function result(): First & Second {
    return local;
}
function defaulted(value = {} as First & Second): void {}
function typed(value: First = {} as First & Second): void {}
function callableDefault(value = (): First & Second => undefined): void {}
function assertedCallableDefault(value = {} as (() => First & Second)): void {}
function satisfiedCallableDefault(value = (() => undefined) satisfies (() => First & Second)): void {}
function genericCallableDefault(value = factory<() => First & Second>()): void {}
function bareGenericCallableDefault(value = factory<(() => First & Second)>): void {}
function nonNullGenericCallableDefault(value = (factory<(() => First & Second)>)!): void {}
interface CombinedContract extends First, Second {}`,
        'no-intersection-type-annotations',
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
