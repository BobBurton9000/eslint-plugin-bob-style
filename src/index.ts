import filenameMatchesDeclaration from "./rules/filename-matches-declaration.js";
import oneDeclarationPerFile from "./rules/one-declaration-per-file.js";
import noExportedStandaloneCallables from "./rules/no-exported-standalone-callables.js";
import noElse from "./rules/no-else.js";
import noGetPrefix from "./rules/no-get-prefix.js";
import preferInlineExports from "./rules/prefer-inline-exports.js";
import noTsUnionType from "./rules/no-ts-union-type.js";
import noTsTypeAlias from "./rules/no-ts-type-alias.js";
import noCallableInterfaces from "./rules/no-callable-interfaces.js";
import noExtendsCallableFunction from "./rules/no-extends-callable-function.js";
import noMixedInterfaces from "./rules/no-mixed-interfaces.js";
import noMagicStrings from "./rules/no-magic-strings.js";
import noAnonymousObjectStructures from "./rules/no-anonymous-object-structures.js";
import maxEffectiveLines from "./rules/max-effective-lines.js";
import { staticClassRestrictions } from "./helpers/static-class-restrictions.js";

export { staticClassRestrictions };

export default {
    rules: {
        "filename-matches-declaration": filenameMatchesDeclaration,
        "one-declaration-per-file": oneDeclarationPerFile,
        "no-exported-standalone-callables": noExportedStandaloneCallables,
        "no-else": noElse,
        "no-get-prefix": noGetPrefix,
        "prefer-inline-exports": preferInlineExports,
        "no-ts-union-type": noTsUnionType,
        "no-ts-type-alias": noTsTypeAlias,
        "no-callable-interfaces": noCallableInterfaces,
        "no-extends-callable-function": noExtendsCallableFunction,
        "no-mixed-interfaces": noMixedInterfaces,
        "no-magic-strings": noMagicStrings,
        "no-anonymous-object-structures": noAnonymousObjectStructures,
        "max-effective-lines": maxEffectiveLines,
    },
};
