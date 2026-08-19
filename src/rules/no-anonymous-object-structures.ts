import type { Rule } from "eslint";
import { isFunctionLikeNode, parameterNodesFrom } from "../helpers/function-parameter-nodes.js";

const isInsideParameterType = (node: unknown): boolean => {
    let current = node as Record<string, unknown> | null;
    while (current) {
        const parent = current.parent as Record<string, unknown> | undefined;
        if (!parent) {
            return false;
        }

        if (parent.type === "TSTypeAnnotation" && current === parent.typeAnnotation) {
            const grandParent = parent.parent as Record<string, unknown> | undefined;
            if (grandParent) {
                const greatGrandParent = grandParent.parent as Record<string, unknown> | undefined;
                if (
                    greatGrandParent &&
                    isFunctionLikeNode(greatGrandParent)
                ) {
                    const params = parameterNodesFrom(greatGrandParent);
                    if (Array.isArray(params) && params.includes(grandParent)) {
                        return true;
                    }
                }
            }
        }

        current = parent;
    }
    return false;
};

const isInsideReturnType = (node: unknown): boolean => {
    let current = node as Record<string, unknown> | null;
    while (current) {
        const parent = current.parent as Record<string, unknown> | undefined;
        if (!parent) {
            return false;
        }

        if (parent.type === "TSTypeAnnotation" && current === parent.typeAnnotation) {
            const grandParent = parent.parent as Record<string, unknown> | undefined;
            if (grandParent && isFunctionLikeNode(grandParent)) {
                if (grandParent.returnType === parent) {
                    return true;
                }
            }
        }

        current = parent;
    }
    return false;
};

const rule: Rule.RuleModule = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow anonymous object type literals in function parameter and return type signatures",
        },
        schema: [],
        messages: {
            noAnonymousTypeLiteral:
                "Anonymous object type literals are not allowed in function parameter and return type signatures. Define a named interface or class instead.",
        },
    },
    create(context) {
        return {
            TSTypeLiteral(node: unknown) {
                if (!isInsideParameterType(node) && !isInsideReturnType(node)) {
                    return;
                }

                context.report({
                    node: node as never,
                    messageId: "noAnonymousTypeLiteral",
                });
            },
        };
    },
};

export default rule;
