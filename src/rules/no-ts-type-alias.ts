import type { Rule } from "eslint";

const rule: Rule.RuleModule = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow TypeScript type aliases",
        },
        schema: [],
        messages: {
            noTsTypeAlias:
                "TypeScript type aliases are not allowed. Use a class, interface, or enum instead.",
        },
    },
    create(context) {
        return {
            TSTypeAliasDeclaration(node: unknown) {
                context.report({
                    node: node as never,
                    messageId: "noTsTypeAlias",
                });
            },
        };
    },
};

export default rule;
