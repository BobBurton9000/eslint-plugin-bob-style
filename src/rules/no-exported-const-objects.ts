import type { Rule } from "eslint";

const rule: Rule.RuleModule = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow exported const objects, class instances, and Object.freeze wrappers",
        },
        schema: [],
        messages: {
            noExportedConstObjects: "Exported const objects, class instances, and Object.freeze wrappers are not allowed. Use a class or enum instead.",
        },
    },
    create(context) {
        const isObjectFreezeCall = (node: unknown) => {
            if (!node || (node as Record<string, unknown>).type !== "CallExpression") {
                return false;
            }

            const typedNode = node as { callee: Record<string, unknown>; arguments: unknown[] };
            if (
                typedNode.callee.type === "MemberExpression" &&
                (typedNode.callee.object as Record<string, unknown>).name === "Object" &&
                (typedNode.callee.property as Record<string, unknown>).name === "freeze"
            ) {
                const firstArg = typedNode.arguments[0];
                return firstArg && (firstArg as Record<string, unknown>).type === "ObjectExpression";
            }

            return false;
        };

        const isObjectOrNewExpression = (node: unknown) => {
            if (!node) {
                return false;
            }
            const type = (node as Record<string, unknown>).type;
            return type === "ObjectExpression" || type === "NewExpression" || isObjectFreezeCall(node);
        };

        const isConstObjectDeclaration = (node: unknown) => {
            if (!node || (node as Record<string, unknown>).type !== "VariableDeclaration") {
                return false;
            }

            const typedNode = node as { kind: string; declarations: Array<{ init: unknown }> };
            if (typedNode.kind !== "const") {
                return false;
            }

            return typedNode.declarations.some((declaration) => isObjectOrNewExpression(declaration.init));
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
                if (isObjectOrNewExpression(typedNode.declaration)) {
                    report(node);
                }
            },
        };
    },
};

export default rule;
