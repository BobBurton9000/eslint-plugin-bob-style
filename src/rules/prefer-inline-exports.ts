import type { Rule } from "eslint";

const rule: Rule.RuleModule = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Prefer inline exports over export { } at bottom of file",
        },
        schema: [],
        messages: {
            useInlineExport: "Use inline export (e.g., 'export class MyClass {}') instead of 'export { MyClass }'",
            noReExport: "Also remember: Re-exports (importing and then exporting from the same module) are not allowed. Import locally, then export from this module.",
        },
    },
    create(context) {
        return {
            ExportNamedDeclaration(node: unknown) {
                const typedNode = node as { source: unknown; specifiers: unknown[] };
                // Skip re-exports (they are handled by no-restricted-syntax)
                if (typedNode.source) {
                    return;
                }

                // Enforce inline exports: report any `export { ... }` list
                if (typedNode.specifiers.length > 0) {
                    context.report({
                        node: node as never,
                        messageId: "useInlineExport",
                    });
                }
            },
        };
    },
};

export default rule;
