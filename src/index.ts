import filenameMatchesDeclaration from "./rules/filename-matches-declaration.js";
import oneDeclarationPerFile from "./rules/one-declaration-per-file.js";
import noExportedStandaloneCallables from "./rules/no-exported-standalone-callables.js";
import noImportPassthroughExports from "./rules/no-import-passthrough-exports.js";
import noElse from "./rules/no-else.js";
import noGetPrefix from "./rules/no-get-prefix.js";
import preferInlineExports from "./rules/prefer-inline-exports.js";
import noTsUnionType from "./rules/no-ts-union-type.js";
import noIntersectionTypeAnnotations from "./rules/no-intersection-type-annotations.js";
import noTsTypeAlias from "./rules/no-ts-type-alias.js";
import noCallableInterfaces from "./rules/no-callable-interfaces.js";
import noExtendsCallableFunction from "./rules/no-extends-callable-function.js";
import methodOnlyInterfaces from "./rules/method-only-interfaces.js";
import noPublicClassProperties from "./rules/no-public-class-properties.js";
import oneParameterPerLine from "./rules/one-parameter-per-line.js";
import noMagicStrings from "./rules/no-magic-strings.js";
import noAnonymousObjectStructures from "./rules/no-anonymous-object-structures.js";
import maxEffectiveLines from "./rules/max-effective-lines.js";
import noExportedConstObjects from "./rules/no-exported-const-objects.js";
import { staticClassRestrictions } from "./helpers/static-class-restrictions.js";

export { staticClassRestrictions };

export default {
    rules: {
        "filename-matches-declaration": filenameMatchesDeclaration,
        "one-declaration-per-file": oneDeclarationPerFile,
        "no-exported-standalone-callables": noExportedStandaloneCallables,
        "no-import-passthrough-exports": noImportPassthroughExports,
        "no-else": noElse,
        "no-get-prefix": noGetPrefix,
        "prefer-inline-exports": preferInlineExports,
        "no-ts-union-type": noTsUnionType,
        "no-intersection-type-annotations": noIntersectionTypeAnnotations,
        "no-ts-type-alias": noTsTypeAlias,
        "no-callable-interfaces": noCallableInterfaces,
        "no-extends-callable-function": noExtendsCallableFunction,
        "method-only-interfaces": methodOnlyInterfaces,
        "no-public-class-properties": noPublicClassProperties,
        "one-parameter-per-line": oneParameterPerLine,
        "no-magic-strings": noMagicStrings,
        "no-anonymous-object-structures": noAnonymousObjectStructures,
        "max-effective-lines": maxEffectiveLines,
        "no-exported-const-objects": noExportedConstObjects,
    },
};
