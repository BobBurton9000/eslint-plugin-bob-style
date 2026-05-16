import type { Rule } from "eslint";

const rule: Rule.RuleModule = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow callable-only interface shapes",
        },
        schema: [],
        messages: {
            noCallableInterfaces:
                "Callable interfaces are not allowed. Define a named method on the interface instead.",
        },
    },
    create(context) {
        const isCallSignatureMember = (member: unknown) => (member as Record<string, unknown>).type === "TSCallSignatureDeclaration";

        return {
            TSInterfaceDeclaration(node: unknown) {
                const typedNode = node as { body: { body: unknown[] } };
                const members = typedNode.body.body;
                if (!members.some(isCallSignatureMember)) {
                    return;
                }

                context.report({
                    node: node as never,
                    messageId: "noCallableInterfaces",
                });
            },
        };
    },
};

export default rule;
