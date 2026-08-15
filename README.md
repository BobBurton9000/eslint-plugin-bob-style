# eslint-plugin-bob-style

> Opinionated TypeScript code style rules advocated by Bob.

## Installation

```bash
npm install --save-dev eslint-plugin-bob-style
```

## Usage

```js
// eslint.config.mjs
import bobStyle from "eslint-plugin-bob-style";

export default [
  bobStyle.configs.recommended,
];
```

## Rules

The plugin's encapsulation model treats interfaces as behavioural contracts:
interfaces contain method signatures only. Classes own state through private
instance properties and expose it through ordinary methods. DTOs are therefore
query-only classes rather than data-only interfaces.

| Rule | Description |
|------|-------------|
| `filename-matches-declaration` | ... |
| `max-effective-lines` | ... |
| `no-anonymous-object-structures` | ... |
| `no-callable-interfaces` | ... |
| `no-else` | ... |
| `no-exported-standalone-callables` | ... |
| `no-extends-callable-function` | ... |
| `no-get-prefix` | ... |
| `method-only-interfaces` | Require interfaces to contain method signatures only. |
| `no-magic-strings` | ... |
| `no-public-class-properties` | Disallow public, protected, and implicit class instance properties and non-private constructor parameter properties. |
| `one-parameter-per-line` | Require one function parameter per line. |
| `no-ts-type-alias` | ... |
| `no-ts-union-type` | ... |
| `one-declaration-per-file` | ... |
| `prefer-inline-exports` | ... |

## Version 2.0.0 Breaking Change

`no-mixed-interfaces` has been removed and is not available as a compatibility
alias. Consumers must remove that rule from their configuration and use
`method-only-interfaces` instead. The 2.0.0 release also adds
`no-public-class-properties`; consumers should declare class state explicitly as
private fields rather than public, protected, or implicit constructor parameter
properties.

## License

MIT
# Published to npm
