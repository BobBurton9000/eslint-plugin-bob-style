const TYPE_LEVEL_FUNCTION_NODE_TYPES = [
    "TSMethodSignature",
    "TSFunctionType",
    "TSCallSignatureDeclaration",
    "TSConstructSignatureDeclaration",
    "TSConstructorType",
];
const FUNCTION_LIKE_TYPES = new Set([
    "FunctionDeclaration",
    "FunctionExpression",
    "ArrowFunctionExpression",
    ...TYPE_LEVEL_FUNCTION_NODE_TYPES,
    "TSEmptyBodyFunctionExpression",
    "TSDeclareFunction",
]);
const TYPE_LEVEL_FUNCTION_TYPES = new Set(TYPE_LEVEL_FUNCTION_NODE_TYPES);

export const isFunctionLikeNode = (node: Record<string, unknown>): boolean => {
    return FUNCTION_LIKE_TYPES.has(node.type as string);
};

export const isTypeLevelFunctionNode = (node: Record<string, unknown>): boolean => {
    return TYPE_LEVEL_FUNCTION_TYPES.has(node.type as string);
};

export const parameterNodesFrom = (node: Record<string, unknown>): ReadonlyArray<unknown> | null => {
    if ("params" in node) {
        return node.params as ReadonlyArray<unknown>;
    }
    if ("parameters" in node) {
        return node.parameters as ReadonlyArray<unknown>;
    }
    return null;
};
