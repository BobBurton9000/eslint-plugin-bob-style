import type { Rule } from "eslint";

type IdentifierNode = {
    type: "Identifier";
    name: string;
};

type PropertyNode = {
    type: "Property";
    computed?: boolean;
    method?: boolean;
    kind?: string;
    value?: ExpressionNode;
};

type SpreadElementNode = {
    type: "SpreadElement";
    argument?: ExpressionNode;
};

type ObjectExpressionNode = {
    type: "ObjectExpression";
    properties: Array<PropertyNode | SpreadElementNode>;
};

type ExpressionNode = IdentifierNode | ObjectExpressionNode | Record<string, unknown>;

type VariableDeclaratorNode = {
    id?: IdentifierNode;
    init?: ExpressionNode;
};

type VariableDeclarationNode = {
    type: "VariableDeclaration";
    declarations: VariableDeclaratorNode[];
};

type ExportSpecifierNode = {
    type: "ExportSpecifier";
    local?: IdentifierNode;
};

const rule: Rule.RuleModule = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow passthrough exports of imported values",
        },
        schema: [],
        messages: {
            noImportPassthroughExports:
                "Imported values must not be exported unchanged or wrapped trivially. Import them where needed or add real local behavior before exporting.",
        },
    },
    create(context) {
        const passthroughBindingNames = new Set<string>();

        const isIdentifier = (node: unknown): node is IdentifierNode => {
            return Boolean(node) && (node as Record<string, unknown>).type === "Identifier";
        };

        const isProperty = (node: unknown): node is PropertyNode => {
            return Boolean(node) && (node as Record<string, unknown>).type === "Property";
        };

        const isSpreadElement = (node: unknown): node is SpreadElementNode => {
            return Boolean(node) && (node as Record<string, unknown>).type === "SpreadElement";
        };

        const isObjectExpression = (node: unknown): node is ObjectExpressionNode => {
            return Boolean(node) && (node as Record<string, unknown>).type === "ObjectExpression";
        };

        const isPassthroughExpression = (node: unknown): boolean => {
            if (isIdentifier(node)) {
                return passthroughBindingNames.has(node.name);
            }

            if (!isObjectExpression(node) || node.properties.length === 0) {
                return false;
            }

            return node.properties.every((property) => {
                if (isSpreadElement(property)) {
                    return isPassthroughExpression(property.argument);
                }

                if (!isProperty(property) || property.computed || property.method || property.kind !== "init") {
                    return false;
                }

                return isPassthroughExpression(property.value);
            });
        };

        const report = (node: unknown) => {
            context.report({
                node: node as never,
                messageId: "noImportPassthroughExports",
            });
        };

        const recordPassthroughDeclarations = (node: VariableDeclarationNode, shouldReport: boolean) => {
            for (const declaration of node.declarations) {
                if (!isIdentifier(declaration.id) || !isPassthroughExpression(declaration.init)) {
                    continue;
                }

                passthroughBindingNames.add(declaration.id.name);
                if (shouldReport) {
                    report(declaration);
                }
            }
        };

        return {
            ImportDeclaration(node: unknown) {
                const typedNode = node as { specifiers?: Array<{ local?: IdentifierNode }> };
                for (const specifier of typedNode.specifiers ?? []) {
                    if (isIdentifier(specifier.local)) {
                        passthroughBindingNames.add(specifier.local.name);
                    }
                }
            },
            VariableDeclaration(node: unknown) {
                const typedNode = node as VariableDeclarationNode;
                recordPassthroughDeclarations(typedNode, false);
            },
            ExportNamedDeclaration(node: unknown) {
                const typedNode = node as {
                    source?: unknown;
                    declaration?: VariableDeclarationNode;
                    specifiers?: ExportSpecifierNode[];
                };

                if (typedNode.source) {
                    return;
                }

                if (typedNode.declaration?.type === "VariableDeclaration") {
                    recordPassthroughDeclarations(typedNode.declaration, true);
                }

                for (const specifier of typedNode.specifiers ?? []) {
                    if (specifier.type !== "ExportSpecifier" || !isIdentifier(specifier.local)) {
                        continue;
                    }

                    if (passthroughBindingNames.has(specifier.local.name)) {
                        report(specifier);
                    }
                }
            },
            ExportDefaultDeclaration(node: unknown) {
                const typedNode = node as { declaration?: ExpressionNode };
                if (isPassthroughExpression(typedNode.declaration)) {
                    report(node);
                }
            },
        };
    },
};

export default rule;
