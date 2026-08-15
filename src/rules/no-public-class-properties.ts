import type { Rule } from "eslint";

type ClassMember = {
    accessibility?: string;
    computed?: boolean;
    key?: { type?: string };
    static?: boolean;
};

const isPrivate = (member: ClassMember) => member.accessibility === "private" || member.key?.type === "PrivateIdentifier";

const rule: Rule.RuleModule = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow public, protected, and implicit class instance properties",
        },
        schema: [],
        messages: {
            nonPrivateProperty: "Class instance properties must be private.",
            nonPrivateParameterProperty: "Constructor parameter properties must be private.",
        },
    },
    create(context) {
        const reportInstanceProperty = (node: unknown) => {
            const member = node as ClassMember;
            if (member.static || isPrivate(member)) {
                return;
            }

            context.report({
                node: node as never,
                messageId: "nonPrivateProperty",
            });
        };

        return {
            PropertyDefinition: reportInstanceProperty,
            AccessorProperty: reportInstanceProperty,
            TSAbstractPropertyDefinition: reportInstanceProperty,
            TSParameterProperty(node: unknown) {
                const parameterProperty = node as ClassMember;
                if (isPrivate(parameterProperty)) {
                    return;
                }

                context.report({
                    node: node as never,
                    messageId: "nonPrivateParameterProperty",
                });
            },
        };
    },
};

export default rule;
