import type { Rule } from "eslint";

const rule: Rule.RuleModule = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow interfaces extending CallableFunction",
        },
        schema: [],
        messages: {
            noExtendsCallableFunction:
                "Interfaces must not extend CallableFunction. Use explicit named methods instead.",
        },
    },
    create(context) {
        const isCallableFunctionHeritage = (heritage: unknown) => {
            const expression = (heritage as { expression: { type: string; name: string } }).expression;
            return expression.type === "Identifier" && expression.name === "CallableFunction";
        };

        return {
            TSInterfaceDeclaration(node: unknown) {
                const typedNode = node as { extends?: unknown[] };
                if (!typedNode.extends || !typedNode.extends.some(isCallableFunctionHeritage)) {
                    return;
                }

                context.report({
                    node: node as never,
                    messageId: "noExtendsCallableFunction",
                });
            },
        };
    },
};

export default rule;
