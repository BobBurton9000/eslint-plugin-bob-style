import type { Rule } from "eslint";

const rule: Rule.RuleModule = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow exported const objects",
        },
        schema: [],
        messages: {
            noExportedConstObjects: "Exported const objects are not allowed. Use a class or enum instead.",
        },
    },
    create(context) {
        const isObjectExpression = (node: unknown) => {
            if (!node) {
                return false;
            }
            return (node as Record<string, unknown>).type === "ObjectExpression";
        };

        const isConstObjectDeclaration = (node: unknown) => {
            if (!node || (node as Record<string, unknown>).type !== "VariableDeclaration") {
                return false;
            }

            const typedNode = node as { kind: string; declarations: Array<{ init: unknown }> };
            if (typedNode.kind !== "const") {
                return false;
            }

            return typedNode.declarations.some((declaration) => isObjectExpression(declaration.init));
        };

        const report = (node: unknown) => {
            context.report({
                node: node as never,
                messageId: "noExportedConstObjects",
            });
        };

        return {
            ExportNamedDeclaration(node: unknown) {
                const typedNode = node as Record<string, unknown>;
                if (isConstObjectDeclaration(typedNode.declaration)) {
                    report(node);
                }
            },
            ExportDefaultDeclaration(node: unknown) {
                const typedNode = node as Record<string, unknown>;
                if (isObjectExpression(typedNode.declaration)) {
                    report(node);
                }
            },
        };
    },
};

export default rule;
