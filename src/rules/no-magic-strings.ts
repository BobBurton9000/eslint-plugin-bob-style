import type { Rule } from "eslint";

interface NoMagicStringsOptions {
    threshold?: number;
    minLength?: number;
}

const rule: Rule.RuleModule = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow repeated string literals; extract into named constants",
        },
        schema: [
            {
                type: "object",
                properties: {
                    threshold: {
                        type: "integer",
                        minimum: 2,
                    },
                    minLength: {
                        type: "integer",
                        minimum: 1,
                    },
                },
                additionalProperties: false,
            } as const,
        ],
        messages: {
            noMagicStrings: "String literal '{{value}}' is used {{count}} times. Extract into a named constant.",
        },
    },
    create(context) {
        const options = (context.options[0] || {}) as NoMagicStringsOptions;
        const threshold = options.threshold || 3;
        const minLength = options.minLength || 3;
        const occurrences = new Map<string, unknown[]>();

        const isException = (node: unknown) => {
            const typedNode = node as { parent: Record<string, unknown> | null };
            const parent = typedNode.parent;
            if (!parent) {
                return true;
            }

            if (parent.type === "ImportDeclaration") {
                return true;
            }
            if (parent.type === "ImportExpression") {
                return true;
            }
            if (
                parent.type === "CallExpression" &&
                parent.callee &&
                (parent.callee as Record<string, unknown>).type === "Identifier" &&
                (parent.callee as { name: string }).name === "require"
            ) {
                return true;
            }
            if (parent.type === "Property" && parent.key === node) {
                return true;
            }
            if (parent.type === "MethodDefinition" && parent.key === node) {
                return true;
            }
            if (parent.type === "TSLiteralType") {
                return true;
            }
            if (parent.type === "TSEnumMember") {
                return true;
            }

            if (
                parent.type === "BinaryExpression" &&
                (parent.operator === "===" || parent.operator === "!==" || parent.operator === "==" || parent.operator === "!=")
            ) {
                const otherSide = parent.left === node ? parent.right : parent.left;
                if (otherSide && (otherSide as Record<string, unknown>).type === "UnaryExpression" && (otherSide as { operator: string }).operator === "typeof") {
                    return true;
                }
            }

            return false;
        };

        return {
            Literal(node: unknown) {
                const typedNode = node as { value: unknown };
                if (typeof typedNode.value !== "string") {
                    return;
                }
                const value = typedNode.value as string;
                if (value.length < minLength) {
                    return;
                }
                if (isException(node)) {
                    return;
                }

                if (!occurrences.has(value)) {
                    occurrences.set(value, []);
                }
                occurrences.get(value)!.push(node);
            },
            "Program:exit"() {
                for (const [value, nodes] of occurrences) {
                    if (nodes.length >= threshold) {
                        for (const n of nodes) {
                            context.report({
                                node: n as never,
                                messageId: "noMagicStrings",
                                data: {
                                    value: value.length > 40 ? value.substring(0, 37) + "..." : value,
                                    count: String(nodes.length),
                                },
                            });
                        }
                    }
                }
            },
        };
    },
};

export default rule;
