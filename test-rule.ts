/* eslint-disable @typescript-eslint/no-unused-vars */

// These should NOT be errors (allowed):
const x: MyInterface = { a: 1 };
let y: { a: number };
interface Foo { prop: { a: number } }
type Bar = { a: number };
const z = { a: 1 };

// These SHOULD be errors (anonymous object types in function signatures):
function foo(x: { a: number }): number { return 1; }
function bar(x: Bar): { b: string } { return { b: "" }; }
const arrow = (x: { a: number }): void => {};
const callback: (x: { a: number }) => void = () => {};
const factory: () => { a: number } = () => ({ a: 1 });
