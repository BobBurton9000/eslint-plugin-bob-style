import type { Rule } from "eslint";

const rule: Rule.RuleModule = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow TypeScript union types",
        },
        schema: [],
        messages: {
            noTsUnionType:
                "TypeScript union types are not allowed. Define a dedicated type or separate interfaces instead.",
        },
    },
    create(context) {
        return {
            TSUnionType(node: unknown) {
                context.report({
                    node: node as never,
                    messageId: "noTsUnionType",
                });
            },
        };
    },
};

export default rule;
