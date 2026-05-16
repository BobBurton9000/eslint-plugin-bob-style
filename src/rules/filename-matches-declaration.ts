import path from "path";
import type { Rule } from "eslint";

const rule: Rule.RuleModule = {
    meta: {
        type: "problem",
        docs: {
            description: "Enforce exported declarations match the file name",
        },
        schema: [],
        messages: {
            filenameMatchesDeclaration:
                "Filename '{{fileName}}' must match exported declaration '{{declarationName}}'.",
        },
    },
    create(context) {
        const filename = context.getFilename();
        if (!filename) {
            return {};
        }

        const ext = path.extname(filename).toLowerCase();
        const allowedExts = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
        if (!allowedExts.has(ext)) {
            return {};
        }

        const baseName = path.basename(filename, ext);
        if (!baseName || baseName === "index") {
            return {};
        }

        const reportIfMismatch = (node: unknown, declarationName: string | null) => {
            if (!declarationName || declarationName === baseName) {
                return;
            }

            context.report({
                node: node as never,
                messageId: "filenameMatchesDeclaration",
                data: { fileName: baseName, declarationName },
            });
        };

        const extractDeclarationName = (node: unknown): string | null => {
            if (!node) {
                return null;
            }

            const typedNode = node as Record<string, unknown>;
            if (
                typedNode.type === "ClassDeclaration" ||
                typedNode.type === "InterfaceDeclaration" ||
                typedNode.type === "TSInterfaceDeclaration"
            ) {
                const id = typedNode.id as Record<string, unknown> | undefined;
                return id ? (id.name as string) : null;
            }

            return null;
        };

        return {
            ExportNamedDeclaration(node: unknown) {
                const typedNode = node as Record<string, unknown>;
                const declarationName = extractDeclarationName(typedNode.declaration);
                if (!declarationName) {
                    return;
                }

                reportIfMismatch(typedNode.declaration, declarationName);
            },
            ExportDefaultDeclaration(node: unknown) {
                const typedNode = node as Record<string, unknown>;
                const declarationName = extractDeclarationName(typedNode.declaration);
                if (!declarationName) {
                    return;
                }

                reportIfMismatch(typedNode.declaration, declarationName);
            },
        };
    },
};

export default rule;
