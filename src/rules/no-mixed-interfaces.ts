import type { Rule } from "eslint";
import * as ts from "typescript";

const isIdentifierNode = (node: unknown) => (node as Record<string, unknown>).type === "Identifier";
const isFunctionExpressionNode = (node: unknown) => (node as Record<string, unknown>).type === "FunctionExpression";
const isArrowFunctionExpressionNode = (node: unknown) => (node as Record<string, unknown>).type === "ArrowFunctionExpression";
const isFunctionLikeNode = (node: unknown) => isFunctionExpressionNode(node) || isArrowFunctionExpressionNode(node);

const getPropertyOrMethodKeyName = (member: unknown) => {
    const typedMember = member as Record<string, unknown>;
    if (!member || typedMember.computed || !typedMember.key) {
        return null;
    }

    const key = typedMember.key as Record<string, unknown>;
    if (key.type === "Identifier") {
        return key.name as string;
    }

    if (key.type === "Literal") {
        return String(key.value);
    }

    return null;
};

const getIndexedAccessLiteralKey = (indexType: unknown) => {
    const typedIndex = indexType as Record<string, unknown>;
    if (!indexType || typedIndex.type !== "TSLiteralType" || !typedIndex.literal) {
        return null;
    }

    const literal = typedIndex.literal as Record<string, unknown>;
    if (literal.type === "Literal") {
        return String(literal.value);
    }

    if (literal.type === "TemplateLiteral" && (literal.expressions as unknown[]).length === 0 && (literal.quasis as unknown[]).length === 1) {
        return ((literal.quasis as Array<{ value?: { cooked?: string } }>)[0]).value?.cooked ?? null;
    }

    return null;
};

function isFunctionValuedType(typeNode: unknown): boolean {
    if (!typeNode) {
        return false;
    }

    const typed = typeNode as Record<string, unknown>;

    if (typed.type === "TSParenthesizedType") {
        return isFunctionValuedType(typed.typeAnnotation);
    }

    if (typed.type === "TSFunctionType" || typed.type === "TSConstructorType") {
        return true;
    }

    if (typed.type === "TSUnionType" || typed.type === "TSIntersectionType") {
        return (typed.types as unknown[]).some((childType) => isFunctionValuedType(childType));
    }

    if (typed.type === "TSConditionalType") {
        return isFunctionValuedType(typed.trueType) || isFunctionValuedType(typed.falseType);
    }

    if (typed.type === "TSIndexedAccessType") {
        const objectType = typed.objectType as Record<string, unknown>;
        if (!objectType || objectType.type !== "TSTypeLiteral") {
            return false;
        }

        const indexedKey = getIndexedAccessLiteralKey(typed.indexType);
        const memberMatchesIndex = (member: unknown) => {
            if (indexedKey === null) {
                return true;
            }

            return getPropertyOrMethodKeyName(member) === indexedKey;
        };

        return (objectType.members as unknown[]).some((member) => {
            if (!memberMatchesIndex(member)) {
                return false;
            }

            const typedMember = member as Record<string, unknown>;
            if (typedMember.type === "TSMethodSignature") {
                return true;
            }

            if (typedMember.type !== "TSPropertySignature") {
                return false;
            }

            const annotation = typedMember.typeAnnotation
                ? (typedMember.typeAnnotation as Record<string, unknown>).typeAnnotation
                : null;
            return isFunctionValuedType(annotation);
        });
    }

    return false;
}

const getPropertySignatureTypeNode = (member: unknown) => {
    const typedMember = member as { typeAnnotation?: { typeAnnotation: unknown } };
    return typedMember.typeAnnotation ? typedMember.typeAnnotation.typeAnnotation : null;
};

const isPropertyLikeInterfaceMember = (member: unknown) => {
    const typedMember = member as Record<string, unknown>;
    return (
        typedMember.type === "TSIndexSignature" ||
        (typedMember.type === "TSPropertySignature" && !isFunctionValuedType(getPropertySignatureTypeNode(member)))
    );
};

const isMethodLikeInterfaceMember = (member: unknown) => {
    const typedMember = member as Record<string, unknown>;
    return (
        typedMember.type === "TSMethodSignature" ||
        (typedMember.type === "TSPropertySignature" && isFunctionValuedType(getPropertySignatureTypeNode(member)))
    );
};

const isNeutralInterfaceMember = (member: unknown) => {
    const typedMember = member as Record<string, unknown>;
    return typedMember.type === "TSCallSignatureDeclaration" || typedMember.type === "TSConstructSignatureDeclaration";
};

const describeInterfaceMemberKind = (member: unknown) => {
    if (isPropertyLikeInterfaceMember(member)) {
        return "property";
    }

    if (isMethodLikeInterfaceMember(member)) {
        return "method";
    }

    if (isNeutralInterfaceMember(member)) {
        return "neutral";
    }

    return "neutral";
};

const summarizeMembers = (members: unknown[]) =>
    members.reduce(
        (summary: { propertyCount: number; methodCount: number }, member) => {
            const kind = describeInterfaceMemberKind(member);
            if (kind === "property") {
                summary.propertyCount += 1;
            }

            if (kind === "method") {
                summary.methodCount += 1;
            }

            return summary;
        },
        { propertyCount: 0, methodCount: 0 },
    );

const getParserServices = (context: Rule.RuleContext) => {
    if (!context.sourceCode.parserServices || !context.sourceCode.parserServices.program) {
        return null;
    }

    return context.sourceCode.parserServices;
};

const getInterfaceMemberSummary = (typeChecker: ts.TypeChecker, interfaceType: ts.Type, visitedSymbols: Set<ts.Symbol>) => {
    const symbol = interfaceType.getSymbol();
    if (!symbol) {
        return { propertyCount: 0, methodCount: 0 };
    }

    if (visitedSymbols.has(symbol)) {
        return { propertyCount: 0, methodCount: 0 };
    }

    visitedSymbols.add(symbol);

    return interfaceType.getProperties().reduce(
        (summary: { propertyCount: number; methodCount: number }, propertySymbol) => {
            const declarations = propertySymbol.getDeclarations() || [];
            const hasMethodDeclaration = declarations.some((declaration) => ts.isMethodSignature(declaration));
            if (hasMethodDeclaration) {
                summary.methodCount += 1;
                return summary;
            }

            const propertyType = typeChecker.getTypeOfSymbolAtLocation(propertySymbol, declarations[0] || (interfaceType as unknown as ts.Symbol).valueDeclaration);
            if (propertyType.getCallSignatures().length > 0) {
                summary.methodCount += 1;
                return summary;
            }

            summary.propertyCount += 1;
            return summary;
        },
        { propertyCount: 0, methodCount: 0 },
    );
};

const rule: Rule.RuleModule = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow interfaces that mix property-like and method-like members",
        },
        schema: [],
        messages: {
            noMixedInterfaces: "Interfaces must be entirely property-only or method-only.",
        },
    },
    create(context) {
        const parserServices = getParserServices(context);

        return {
            TSInterfaceDeclaration(node: unknown) {
                const typedNode = node as { body: { body: unknown[] } };
                if (!parserServices) {
                    const { propertyCount, methodCount } = summarizeMembers(typedNode.body.body);

                    if (propertyCount > 0 && methodCount > 0) {
                        context.report({
                            node: node as never,
                            messageId: "noMixedInterfaces",
                        });
                    }

                    return;
                }

                const typeChecker = parserServices.program.getTypeChecker();
                const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);
                const interfaceType = typeChecker.getTypeAtLocation(tsNode);
                const { propertyCount, methodCount } = getInterfaceMemberSummary(typeChecker, interfaceType, new Set());

                if (propertyCount > 0 && methodCount > 0) {
                    context.report({
                        node: node as never,
                        messageId: "noMixedInterfaces",
                    });
                }
            },
        };
    },
};

export default rule;
