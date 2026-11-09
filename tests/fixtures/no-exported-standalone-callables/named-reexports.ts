export {
    standaloneFunction as renamedFunction,
    standaloneArrow,
    value,
    Model,
    type CallableContract,
    type CallableInterface,
} from "./callables.js";

import type { standaloneFunction as importedTypeOnly } from "./callables.js";
import { type standaloneArrow as typeOnlySpecifier } from "./callables.js";
export { importedTypeOnly, typeOnlySpecifier };
