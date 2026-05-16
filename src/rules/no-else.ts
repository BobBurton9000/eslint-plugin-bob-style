import type { Rule } from "eslint";

const rule: Rule.RuleModule = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow all else and else if statements",
        },
        schema: [],
        messages: {
            noElse: "Else statements are not allowed. Use early returns or ternary expressions instead.",
        },
    },
    create(context) {
        return {
            IfStatement(node: unknown) {
                const typedNode = node as { alternate: unknown };
                if (typedNode.alternate) {
                    context.report({
                        node: typedNode.alternate as never,
                        messageId: "noElse",
                    });
                }
            },
        };
    },
};

export default rule;
