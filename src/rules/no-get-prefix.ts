import type { Rule } from "eslint";

const rule: Rule.RuleModule = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow functions whose names start with 'get'",
        },
        schema: [],
        messages: {
            noGetPrefix: "Function name '{{name}}' must not start with 'get'.",
        },
    },
    create(context) {
        const isGetPrefixed = (name: string) => name.startsWith("get");
        const report = (node: unknown, name: string) => {
            context.report({
                node: node as never,
                messageId: "noGetPrefix",
                data: { name },
            });
        };

        const isIdentifierNode = (node: unknown) => (node as Record<string, unknown>).type === "Identifier";
        const isFunctionExpressionNode = (node: unknown) => (node as Record<string, unknown>).type === "FunctionExpression";
        const isArrowFunctionExpressionNode = (node: unknown) => (node as Record<string, unknown>).type === "ArrowFunctionExpression";
        const isFunctionLikeNode = (node: unknown) => isFunctionExpressionNode(node) || isArrowFunctionExpressionNode(node);
        const hasIdentifierId = (node: unknown) => Boolean((node as Record<string, unknown>).id) && isIdentifierNode((node as Record<string, unknown>).id);
        const hasFunctionInitializer = (node: unknown) => Boolean((node as Record<string, unknown>).init) && isFunctionLikeNode((node as Record<string, unknown>).init);
        const hasIdentifierKey = (node: unknown) => !(node as Record<string, unknown>).computed && isIdentifierNode((node as Record<string, unknown>).key);
        const isFunctionProperty = (node: unknown) =>
            (node as Record<string, unknown>).method ||
            (Boolean((node as Record<string, unknown>).value) && isFunctionLikeNode((node as Record<string, unknown>).value));

        return {
            FunctionDeclaration(node: unknown) {
                const typedNode = node as { id?: { name: string } | null };
                if (typedNode.id && isGetPrefixed(typedNode.id.name)) {
                    report(typedNode.id, typedNode.id.name);
                }
            },
            VariableDeclarator(node: unknown) {
                if (!hasIdentifierId(node)) {
                    return;
                }
                if (!hasFunctionInitializer(node)) {
                    return;
                }
                const typedNode = node as { id: { name: string } };
                if (!isGetPrefixed(typedNode.id.name)) {
                    return;
                }
                report(typedNode.id, typedNode.id.name);
            },
            Property(node: unknown) {
                if (!hasIdentifierKey(node)) {
                    return;
                }
                if (!isFunctionProperty(node)) {
                    return;
                }
                const typedNode = node as { key: { name: string } };
                if (!isGetPrefixed(typedNode.key.name)) {
                    return;
                }
                report(typedNode.key, typedNode.key.name);
            },
            MethodDefinition(node: unknown) {
                const typedNode = node as { computed: boolean; key: { type: string; name: string } };
                if (typedNode.computed || typedNode.key.type !== "Identifier") {
                    return;
                }

                if (isGetPrefixed(typedNode.key.name)) {
                    report(typedNode.key, typedNode.key.name);
                }
            },
        };
    },
};

export default rule;
