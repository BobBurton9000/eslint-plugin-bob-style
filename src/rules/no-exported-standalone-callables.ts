import type { Rule } from "eslint";

type CallableType = {
    getCallSignatures: () => unknown[];
};

type TypeScriptSymbol = {
    name: string;
    valueDeclaration?: unknown;
};

type TypeScriptChecker = {
    getAliasedSymbol: (symbol: TypeScriptSymbol) => TypeScriptSymbol;
    getExportsOfModule: (symbol: TypeScriptSymbol) => TypeScriptSymbol[];
    getTypeOfSymbolAtLocation: (symbol: TypeScriptSymbol, location: unknown) => CallableType;
};

type TypeScriptParserServices = {
    getSymbolAtLocation?: (node: unknown) => TypeScriptSymbol | undefined;
    getTypeAtLocation?: (node: unknown) => CallableType;
    program?: { getTypeChecker: () => TypeScriptChecker } | null;
};

type IdentifierNode = {
    type: "Identifier";
    name: string;
};

type VariableDeclarationNode = {
    type: "VariableDeclaration";
    declarations: Array<{ id?: IdentifierNode; init?: unknown }>;
};

const rule: Rule.RuleModule = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow exported standalone callable values, including identifiable named re-exports",
        },
        schema: [],
        messages: {
            noExportedStandaloneCallables: "Exported standalone callable values are not allowed. Encapsulate behavior in a class and export the class instead.",
        },
    },
    create(context) {
        const parserServices = (context.sourceCode.parserServices ?? {}) as TypeScriptParserServices;
        const checker = parserServices.program?.getTypeChecker();
        const locallyDeclaredCallables = new Set<string>();
        const typeOnlyImportBindings = new Set<string>();

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

        const isCallableType = (node: unknown) => {
            if (!parserServices.getTypeAtLocation) {
                return false;
            }

            try {
                return parserServices.getTypeAtLocation(node).getCallSignatures().length > 0;
            } catch {
                return false;
            }
        };

        const hasCallableInitializer = (node: unknown) => {
            if (!node || (node as Record<string, unknown>).type !== "VariableDeclaration") {
                return false;
            }

            const typedNode = node as VariableDeclarationNode;
            return typedNode.declarations.some((declaration) =>
                isCallableNode(declaration.init) || isCallableType(declaration.id),
            );
        };

        const collectLocallyDeclaredCallables = (declaration: unknown) => {
            if (!declaration) {
                return;
            }

            const typedNode = declaration as Record<string, unknown>;
            if (typedNode.type === "FunctionDeclaration") {
                const id = typedNode.id as IdentifierNode | null;
                if (id?.type === "Identifier") {
                    locallyDeclaredCallables.add(id.name);
                }
                return;
            }

            if (typedNode.type !== "VariableDeclaration") {
                return;
            }

            const variableDeclaration = typedNode as unknown as VariableDeclarationNode;
            for (const declarator of variableDeclaration.declarations) {
                if (declarator.id?.type === "Identifier" && isCallableNode(declarator.init)) {
                    locallyDeclaredCallables.add(declarator.id.name);
                }
            }
        };

        const isKnownCallableExport = (node: unknown, localName: string, hasSource: boolean) => {
            if (!hasSource && typeOnlyImportBindings.has(localName)) {
                return false;
            }

            if (!hasSource && locallyDeclaredCallables.has(localName)) {
                return true;
            }

            // Re-exported and type-annotated values are classified only when a TypeScript
            // program is available; otherwise their callability cannot be established safely.
            return isCallableType(node);
        };

        const hasCallableStarReExport = (node: { source?: unknown }) => {
            if (!checker || !parserServices.getSymbolAtLocation || !node.source) {
                return false;
            }

            try {
                const moduleSymbol = parserServices.getSymbolAtLocation(node.source);
                if (!moduleSymbol) {
                    return false;
                }

                return checker.getExportsOfModule(moduleSymbol).some((symbol) => {
                    // `export *` never re-exports a module's default export. Type-only
                    // symbols have no value declaration and are deliberately ignored.
                    if (symbol.name === "default") {
                        return false;
                    }

                    let valueSymbol = symbol;
                    try {
                        valueSymbol = checker.getAliasedSymbol(symbol);
                    } catch {
                        // A non-alias symbol is already the value symbol.
                    }

                    if (!valueSymbol.valueDeclaration) {
                        return false;
                    }

                    try {
                        return checker.getTypeOfSymbolAtLocation(valueSymbol, valueSymbol.valueDeclaration)
                            .getCallSignatures().length > 0;
                    } catch {
                        return false;
                    }
                });
            } catch {
                return false;
            }
        };

        const report = (node: unknown) => {
            context.report({
                node: node as never,
                messageId: "noExportedStandaloneCallables",
            });
        };

        return {
            Program(node: unknown) {
                const body = (node as { body: Array<Record<string, unknown>> }).body;
                for (const statement of body) {
                    if (statement.type === "ImportDeclaration") {
                        const isTypeOnlyImport = statement.importKind === "type";
                        for (const specifier of (statement.specifiers ?? []) as Array<{
                            importKind?: string;
                            local?: IdentifierNode;
                        }>) {
                            if (
                                specifier.local?.type === "Identifier" &&
                                (isTypeOnlyImport || specifier.importKind === "type")
                            ) {
                                typeOnlyImportBindings.add(specifier.local.name);
                            }
                        }
                    } else if (statement.type === "ExportNamedDeclaration") {
                        collectLocallyDeclaredCallables(statement.declaration);
                    } else if (statement.type === "ExportDefaultDeclaration") {
                        collectLocallyDeclaredCallables(statement.declaration);
                    } else {
                        collectLocallyDeclaredCallables(statement);
                    }
                }
            },
            ExportNamedDeclaration(node: unknown) {
                const typedNode = node as {
                    declaration?: unknown;
                    exportKind?: string;
                    source?: unknown;
                    specifiers?: Array<{
                        type?: string;
                        exportKind?: string;
                        local?: IdentifierNode;
                    }>;
                };

                if (typedNode.exportKind === "type") {
                    return;
                }

                if (isCallableNode(typedNode.declaration) || hasCallableInitializer(typedNode.declaration)) {
                    report(node);
                }

                for (const specifier of typedNode.specifiers ?? []) {
                    if (
                        specifier.type !== "ExportSpecifier" ||
                        specifier.exportKind === "type" ||
                        specifier.local?.type !== "Identifier"
                    ) {
                        continue;
                    }

                    if (isKnownCallableExport(specifier.local, specifier.local.name, Boolean(typedNode.source))) {
                        report(specifier);
                    }
                }
            },
            ExportAllDeclaration(node: unknown) {
                const typedNode = node as {
                    exportKind?: string;
                    exported?: unknown;
                    source?: unknown;
                };

                // Namespace re-exports expose a module object, not its standalone callables.
                if (
                    typedNode.exportKind !== "type" &&
                    !typedNode.exported &&
                    hasCallableStarReExport(typedNode)
                ) {
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
