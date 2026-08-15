import type { Rule } from "eslint";

const prohibitedMemberTypes = new Set([
    "TSPropertySignature",
    "TSIndexSignature",
    "TSCallSignatureDeclaration",
    "TSConstructSignatureDeclaration",
]);

const rule: Rule.RuleModule = {
    meta: {
        type: "problem",
        docs: {
            description: "Require interfaces to contain method signatures only",
        },
        schema: [],
        messages: {
            prohibitedMember: "Interfaces may contain method signatures only.",
        },
    },
    create(context) {
        return {
            TSInterfaceDeclaration(node: unknown) {
                const typedNode = node as { body: { body: Array<{ type: string }> } };
                for (const member of typedNode.body.body) {
                    if (!prohibitedMemberTypes.has(member.type)) {
                        continue;
                    }

                    context.report({
                        node: member as never,
                        messageId: "prohibitedMember",
                    });
                }
            },
        };
    },
};

export default rule;
