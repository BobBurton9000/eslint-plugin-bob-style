import type { Rule } from "eslint";

const rule: Rule.RuleModule = {
    meta: {
        type: "problem",
        docs: {
            description: "Enforce at most one class declaration, class expression, or interface declaration per file",
        },
        schema: [],
        messages: {
            multipleDeclarations: "File must contain no more than one class declaration, class expression, or interface declaration.",
        },
    },
    create(context) {
        let classCount = 0;
        let interfaceCount = 0;

        return {
            ClassDeclaration() {
                classCount++;
            },
            ClassExpression() {
                classCount++;
            },
            InterfaceDeclaration() {
                interfaceCount++;
            },
            TSInterfaceDeclaration() {
                interfaceCount++;
            },
            "Program:exit"(node: unknown) {
                if (classCount + interfaceCount > 1) {
                    context.report({
                        node: node as never,
                        loc: { line: 1, column: 0 },
                        messageId: "multipleDeclarations",
                    });
                }
            },
        };
    },
};

export default rule;
