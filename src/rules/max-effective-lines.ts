import type { Rule } from "eslint";

interface MaxEffectiveLinesOptions {
    max?: number;
}

const rule: Rule.RuleModule = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Enforce a maximum effective line count while ignoring import declaration lines",
        },
        schema: [
            {
                type: "object",
                properties: {
                    max: {
                        type: "integer",
                        minimum: 1,
                    },
                },
                additionalProperties: false,
            } as const,
        ],
        messages: {
            maxEffectiveLines:
                "File has {{effectiveLineCount}} effective lines ({{totalLineCount}} total, {{ignoredLineCount}} import lines ignored), exceeding the limit of {{max}}.",
        },
    },
    create(context) {
        const options = (context.options[0] || {}) as MaxEffectiveLinesOptions;
        const max = options.max || 500;

        const mergeIntervals = (intervals: [number, number][]) => {
            if (intervals.length <= 1) {
                return intervals;
            }

            const sorted = [...intervals].sort((left, right) => left[0] - right[0]);
            const merged: [number, number][] = [sorted[0]];

            for (let index = 1; index < sorted.length; index += 1) {
                const interval = sorted[index];
                const current = merged[merged.length - 1];

                if (interval[0] <= current[1]) {
                    current[1] = Math.max(current[1], interval[1]);
                    continue;
                }

                merged.push(interval);
            }

            return merged;
        };

        const getIgnoredImportLineNumbers = (programNode: unknown) => {
            const importLineIntervals = new Map<number, [number, number][]>();
            const commentLineIntervals = new Map<number, [number, number][]>();
            const sourceLines = context.sourceCode.lines;

            const addNodeIntervalsByLine = (intervalMap: Map<number, [number, number][]>, astNode: unknown) => {
                const typedNode = astNode as { loc?: { start: { line: number; column: number }; end: { line: number; column: number } } };
                if (!typedNode.loc) {
                    return;
                }

                for (let line = typedNode.loc.start.line; line <= typedNode.loc.end.line; line += 1) {
                    const lineIndex = line - 1;
                    const lineText = sourceLines[lineIndex] || "";
                    const startColumn = line === typedNode.loc.start.line ? typedNode.loc.start.column : 0;
                    const endColumn = line === typedNode.loc.end.line ? typedNode.loc.end.column : lineText.length;

                    const existingIntervals = intervalMap.get(line) || [];
                    existingIntervals.push([startColumn, endColumn]);
                    intervalMap.set(line, existingIntervals);
                }
            };

            const isWhitespaceOrCommentOnly = (lineText: string, startColumn: number, endColumn: number, commentIntervals: [number, number][]) => {
                let commentIndex = 0;

                for (let column = startColumn; column < endColumn; column += 1) {
                    const character = lineText[column] || "";
                    if (/\s/.test(character)) {
                        continue;
                    }

                    while (
                        commentIndex < commentIntervals.length &&
                        column >= commentIntervals[commentIndex][1]
                    ) {
                        commentIndex += 1;
                    }

                    const currentCommentInterval = commentIntervals[commentIndex];
                    const isInComment =
                        Boolean(currentCommentInterval) &&
                        column >= currentCommentInterval[0] &&
                        column < currentCommentInterval[1];

                    if (!isInComment) {
                        return false;
                    }
                }

                return true;
            };

            const typedProgram = programNode as { body: Array<{ type: string; loc?: { start: { line: number }; end: { line: number } } }> };
            for (const statement of typedProgram.body) {
                if (statement.type !== "ImportDeclaration" || !statement.loc) {
                    continue;
                }

                addNodeIntervalsByLine(importLineIntervals, statement);
            }

            for (const comment of context.sourceCode.getAllComments()) {
                addNodeIntervalsByLine(commentLineIntervals, comment);
            }

            const ignoredImportLines = new Set<number>();

            for (const [line, intervals] of importLineIntervals.entries()) {
                const mergedIntervals = mergeIntervals(intervals);
                const mergedCommentIntervals = mergeIntervals(commentLineIntervals.get(line) || []);
                const lineText = sourceLines[line - 1] || "";
                let cursor = 0;
                let hasNonWhitespaceOutsideImport = false;

                for (const [startColumn, endColumn] of mergedIntervals) {
                    if (!isWhitespaceOrCommentOnly(lineText, cursor, startColumn, mergedCommentIntervals)) {
                        hasNonWhitespaceOutsideImport = true;
                        break;
                    }

                    cursor = endColumn;
                }

                if (
                    !hasNonWhitespaceOutsideImport &&
                    isWhitespaceOrCommentOnly(lineText, cursor, lineText.length, mergedCommentIntervals)
                ) {
                    ignoredImportLines.add(line);
                }
            }

            return ignoredImportLines;
        };

        return {
            "Program:exit"(node: unknown) {
                const totalLineCount = context.sourceCode.lines.length;
                const importLines = getIgnoredImportLineNumbers(node);
                const ignoredLineCount = importLines.size;
                const effectiveLineCount = totalLineCount - ignoredLineCount;

                if (effectiveLineCount <= max) {
                    return;
                }

                context.report({
                    node: node as never,
                    loc: { line: 1, column: 0 },
                    messageId: "maxEffectiveLines",
                    data: {
                        effectiveLineCount: String(effectiveLineCount),
                        totalLineCount: String(totalLineCount),
                        ignoredLineCount: String(ignoredLineCount),
                        max: String(max),
                    },
                });
            },
        };
    },
};

export default rule;
