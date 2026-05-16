import type { Rule } from "eslint";

const rule: Rule.RuleModule = {
    meta: {
        type: "problem",
        docs: {
            description: "Enforce one class OR interface per file",
        },
        schema: [],
        messages: {
            multipleDeclarations: "File must contain only one class OR one interface, not both or multiple of either.",
        },
    },
    create(context) {
        let classCount = 0;
        let interfaceCount = 0;

        return {
            ClassDeclaration() {
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
