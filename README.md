# eslint-plugin-bob-style

> Opinionated TypeScript code style rules advocated by Bob.

The rules support a strongly encapsulated style: interfaces describe behavior,
class state is private, and exported behavior is represented by classes rather
than standalone callables.

## Installation

```bash
npm install --save-dev eslint eslint-plugin-bob-style typescript @typescript-eslint/parser
```

The TypeScript parser is needed when linting TypeScript files. The plugin
requires ESLint 9 or newer and TypeScript 5 or newer (below 6.1).

## Usage

The plugin exports its rules but does not provide a `recommended` preset. Add
the plugin to an ESLint flat config and enable the rules you want:

```js
// eslint.config.mjs
import tsParser from "@typescript-eslint/parser";
import bobStyle from "eslint-plugin-bob-style";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      sourceType: "module",
    },
    plugins: {
      "bob-style": bobStyle,
    },
    rules: {
      "bob-style/method-only-interfaces": "error",
      "bob-style/no-else": "error",
      "bob-style/no-public-class-properties": "error",
      "bob-style/one-parameter-per-line": "error",
    },
  },
];
```

Rules are individually configurable under the `bob-style/` namespace. For
example, options can be supplied to the line-count and repeated-string rules:

```js
rules: {
  "bob-style/max-effective-lines": ["error", { max: 300 }],
  "bob-style/no-magic-strings": ["warn", { threshold: 2, minLength: 4 }],
}
```

`no-exported-standalone-callables` can recognize direct local function exports
without type information. To classify named re-exports and `export *`, configure
`@typescript-eslint/parser` with type information (for example, its
`parserOptions.project` setting).

## Rules

| Rule | Description |
|------|-------------|
| `filename-matches-declaration` | Require exported class and interface declaration names to match the file basename. `index` files are exempt. |
| `max-effective-lines` | Limit file length while excluding lines occupied only by imports. Default limit: 500 lines; configure with `{ max }`. |
| `method-only-interfaces` | Allow method signatures only in interfaces; disallow properties, index signatures, call signatures, and construct signatures. |
| `no-anonymous-object-structures` | Disallow anonymous object type literals in function parameter and return type signatures; use a named interface or class. |
| `no-callable-interfaces` | Disallow interfaces containing call signatures. |
| `no-else` | Disallow `else` and `else if` branches; prefer early returns or conditional expressions. |
| `no-exported-const-objects` | Disallow exported const object literals, class instances, and `Object.freeze` wrappers around object literals. |
| `no-exported-standalone-callables` | Disallow exported standalone functions and callable values, including named re-exports when their callability can be determined. Type-aware `export *` checks are also supported. |
| `no-extends-callable-function` | Disallow interfaces that extend `CallableFunction`. |
| `no-get-prefix` | Disallow recognized function and method names beginning with `get`. |
| `no-import-passthrough-exports` | Disallow importing a value and exporting it unchanged or inside a trivial object/spread wrapper. |
| `no-intersection-type-annotations` | Disallow intersection types in property and function parameter annotations; define an interface that extends the required contracts instead. |
| `no-magic-strings` | Report repeated string literals so they can be extracted into named constants. Defaults: `{ threshold: 3, minLength: 3 }`. |
| `no-public-class-properties` | Require class instance properties and constructor parameter properties to be private. Static members are not checked. |
| `no-ts-type-alias` | Disallow TypeScript type aliases. |
| `no-ts-union-type` | Disallow TypeScript union types. |
| `one-declaration-per-file` | Allow at most one class declaration, class expression, or interface declaration per file. |
| `one-parameter-per-line` | Require each parameter in multi-parameter signatures to be on its own line. Includes an automatic whitespace fixer. |
| `prefer-inline-exports` | Prefer inline declarations such as `export class Model {}` over a separate local `export { Model }` list. |

## Additional export

The package also exports `staticClassRestrictions`, a selector list for
ESLint's core `no-restricted-syntax` rule. It can be used to disallow static
class fields, methods, and blocks:

```js
import { staticClassRestrictions } from "eslint-plugin-bob-style";

// Add to a config object's rules:
"no-restricted-syntax": ["error", ...staticClassRestrictions]
```

## Migration note

Version 2.0 removed the `no-mixed-interfaces` rule without a compatibility
alias. Replace it with `method-only-interfaces`. Version 2.0 also introduced
`no-public-class-properties` for enforcing private instance state.

## License

MIT
