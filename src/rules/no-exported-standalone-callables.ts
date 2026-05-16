import type { Rule } from "eslint";

const rule: Rule.RuleModule = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow exported standalone callable values",
        },
        schema: [],
        messages: {
            noExportedStandaloneCallables: "Exported standalone functions are not allowed. Encapsulate behavior in a class and export the class instead.",
        },
    },
    create(context) {
        const isCallableNode = (node: unknown) => {
            if (!node) {
                return false;
            }

            const typedNode = node as Record<string, unknown>;
            return (
                typedNode.type === "FunctionDeclaration" ||
                typedNode.type === "FunctionExpression" ||
                typedNode.type === "ArrowFunctionExpression"
            );
        };

        const hasCallableInitializer = (node: unknown) => {
            if (!node || (node as Record<string, unknown>).type !== "VariableDeclaration") {
                return false;
            }

            const typedNode = node as { declarations: Array<{ init: unknown }> };
            return typedNode.declarations.some((declaration) => isCallableNode(declaration.init));
        };

        const report = (node: unknown) => {
            context.report({
                node: node as never,
                messageId: "noExportedStandaloneCallables",
            });
        };

        return {
            ExportNamedDeclaration(node: unknown) {
                const typedNode = node as Record<string, unknown>;
                if (isCallableNode(typedNode.declaration) || hasCallableInitializer(typedNode.declaration)) {
                    report(node);
                }
            },
            ExportDefaultDeclaration(node: unknown) {
                const typedNode = node as Record<string, unknown>;
                if (isCallableNode(typedNode.declaration)) {
                    report(node);
                }
            },
        };
    },
};

export default rule;
