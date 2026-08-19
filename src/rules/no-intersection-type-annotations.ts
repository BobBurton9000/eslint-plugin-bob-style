import type { Rule } from "eslint";
import {
    isFunctionLikeNode,
    isTypeLevelFunctionNode,
    parameterNodesFrom,
} from "../helpers/function-parameter-nodes.js";
const PARAMETER_TYPE_CONTEXT_NODE_TYPES = new Set([
    "Identifier",
    "ObjectPattern",
    "ArrayPattern",
    "AssignmentPattern",
    "RestElement",
    "TSParameterProperty",
]);
const PROPERTY_TYPE_OWNERS = new Set([
    "PropertyDefinition",
    "AccessorProperty",
    "TSAbstractAccessorProperty",
    "TSAbstractPropertyDefinition",
    "TSIndexSignature",
    "TSPropertySignature",
]);

const parentFrom = (node: unknown): Record<string, unknown> | null => {
    const parent = (node as Record<string, unknown>).parent;
    if (parent === undefined) {
        return null;
    }
    return parent as Record<string, unknown>;
};

const isTransparentParameterTypeContextNode = (node: Record<string, unknown>): boolean => {
    const nodeType = node.type as string;
    if (PARAMETER_TYPE_CONTEXT_NODE_TYPES.has(nodeType)) {
        return true;
    }
    if (!nodeType.startsWith("TS")) {
        return false;
    }
    return !("expression" in node);
};

const isInsidePropertyTypeAnnotation = (node: unknown): boolean => {
    let currentNode = node as Record<string, unknown> | null;
    while (currentNode !== null) {
        const parentNode = parentFrom(currentNode);
        if (parentNode === null) {
            return false;
        }
        if (
            parentNode.type === "TSTypeAnnotation" &&
            currentNode === parentNode.typeAnnotation
        ) {
            const annotationOwner = parentFrom(parentNode);
            if (
                annotationOwner !== null &&
                PROPERTY_TYPE_OWNERS.has(annotationOwner.type as string) &&
                annotationOwner.typeAnnotation === parentNode
            ) {
                return true;
            }
        }
        if (
            parentNode.type === "TSMappedType" &&
            currentNode === parentNode.typeAnnotation
        ) {
            return true;
        }
        currentNode = parentNode;
    }
    return false;
};

const isFunctionParameterTypeAnnotation = (typeAnnotation: Record<string, unknown>): boolean => {
    let currentNode: Record<string, unknown> | null = typeAnnotation;
    while (currentNode !== null) {
        const parentNode = parentFrom(currentNode);
        if (parentNode === null) {
            return false;
        }
        if (isFunctionLikeNode(parentNode)) {
            const parameterNodes = parameterNodesFrom(parentNode);
            if (parameterNodes?.includes(currentNode)) {
                return true;
            }
            if (!isTypeLevelFunctionNode(parentNode)) {
                return false;
            }
        }
        if (!isTransparentParameterTypeContextNode(parentNode)) {
            return false;
        }
        currentNode = parentNode;
    }
    return false;
};

const isInsideFunctionParameterTypeAnnotation = (node: unknown): boolean => {
    let currentNode = node as Record<string, unknown> | null;
    while (currentNode !== null) {
        const parentNode = parentFrom(currentNode);
        if (parentNode === null) {
            return false;
        }
        if (
            parentNode.type === "TSTypeAnnotation" &&
            currentNode === parentNode.typeAnnotation
        ) {
            if (isFunctionParameterTypeAnnotation(parentNode)) {
                return true;
            }
        }
        currentNode = parentNode;
    }
    return false;
};

const rule: Rule.RuleModule = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow intersection types in property and parameter type annotations",
        },
        schema: [],
        messages: {
            noIntersectionTypeAnnotation:
                "Intersection types are not allowed in property or parameter type annotations. Define an explicit interface that extends the required Contracts instead.",
        },
    },
    create(context) {
        return {
            TSIntersectionType(node: unknown) {
                if (
                    !isInsidePropertyTypeAnnotation(node) &&
                    !isInsideFunctionParameterTypeAnnotation(node)
                ) {
                    return;
                }
                context.report({
                    node: node as never,
                    messageId: "noIntersectionTypeAnnotation",
                });
            },
        };
    },
};

export default rule;
