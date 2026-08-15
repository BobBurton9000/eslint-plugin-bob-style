import type { Rule } from "eslint";

type SourceCode = Rule.RuleContext["sourceCode"];

type PositionedNode = {
    loc: {
        start: {
            line: number;
        };
        end: {
            line: number;
        };
    };
    range: [number, number];
};

type FunctionNode = {
    params: PositionedNode[];
};

type ParameterFix = (fixer: Rule.RuleFixer) => Rule.Fix;

const functionNodeTypes = [
    "ArrowFunctionExpression",
    "FunctionDeclaration",
    "FunctionExpression",
    "TSCallSignatureDeclaration",
    "TSConstructSignatureDeclaration",
    "TSConstructorType",
    "TSDeclareFunction",
    "TSFunctionType",
    "TSMethodSignature",
] as const;

function parameterIndentation(
    sourceCode: SourceCode,
    openingParenthesis: PositionedNode
): string {
    const openingLine = sourceCode.lines[openingParenthesis.loc.start.line - 1];
    const baseIndentation = openingLine.match(/^\s*/u)?.[0] ?? "";
    return `${baseIndentation}    `;
}

function parameterListFixes(
    sourceCode: SourceCode,
    node: FunctionNode,
    openingParenthesis: PositionedNode,
    closingParenthesis: PositionedNode
): Rule.ReportFixer[] {
    const indentation = parameterIndentation(sourceCode, openingParenthesis);
    const firstParameter = node.params[0];
    const lastParameter = node.params.at(-1);
    const fixes: ParameterFix[] = [];
    if (firstParameter === undefined || lastParameter === undefined) {
        return fixes;
    }
    if (openingParenthesis.loc.end.line === firstParameter.loc.start.line) {
        fixes.push((fixer) => fixer.insertTextAfter(openingParenthesis as never, `\n${indentation}`));
    }
    for (let parameterIndex = 1; parameterIndex < node.params.length; parameterIndex += 1) {
        const previousParameter = node.params[parameterIndex - 1];
        const currentParameter = node.params[parameterIndex];
        if (previousParameter === undefined || currentParameter === undefined) {
            continue;
        }
        if (previousParameter.loc.end.line !== currentParameter.loc.start.line) {
            continue;
        }
        const commaToken = sourceCode.getTokenAfter(previousParameter as never);
        if (commaToken === null) {
            continue;
        }
        const textBetweenParameters = sourceCode.text.slice(commaToken.range[1], currentParameter.range[0]);
        if (/^\s*$/u.test(textBetweenParameters)) {
            fixes.push((fixer) => fixer.replaceTextRange(
                [commaToken.range[1], currentParameter.range[0]],
                `\n${indentation}`
            ));
        }
    }
    if (lastParameter.loc.end.line === closingParenthesis.loc.start.line) {
        const openingLine = sourceCode.lines[openingParenthesis.loc.start.line - 1];
        const baseIndentation = openingLine.match(/^\s*/u)?.[0] ?? "";
        fixes.push((fixer) => fixer.insertTextBefore(closingParenthesis as never, `\n${baseIndentation}`));
    }
    return fixes;
}

function checkFunctionParameters(
    context: Rule.RuleContext,
    node: unknown
): void {
    const typedNode = node as FunctionNode;
    if (typedNode.params.length < 2) {
        return;
    }
    const sourceCode = context.sourceCode;
    const firstParameter = typedNode.params[0];
    const lastParameter = typedNode.params.at(-1);
    if (firstParameter === undefined || lastParameter === undefined) {
        return;
    }
    const openingParenthesis = sourceCode.getTokenBefore(firstParameter as never) as unknown as PositionedNode;
    const closingParenthesis = sourceCode.getTokenAfter(lastParameter as never) as unknown as PositionedNode;
    const hasSingleParameterPerLine = typedNode.params.every((parameter, parameterIndex) => {
        if (parameterIndex === 0) {
            return openingParenthesis.loc.end.line < parameter.loc.start.line;
        }
        const previousParameter = typedNode.params[parameterIndex - 1];
        return previousParameter !== undefined && previousParameter.loc.end.line < parameter.loc.start.line;
    }) && lastParameter.loc.end.line < closingParenthesis.loc.start.line;
    if (hasSingleParameterPerLine) {
        return;
    }
    const fixes = parameterListFixes(sourceCode, typedNode, openingParenthesis, closingParenthesis);
    const fix: Rule.ReportFixer = (fixer) => fixes.map(
        (createFix) => createFix(fixer as Rule.RuleFixer)
    ) as unknown as Rule.Fix[];
    context.report({
        node: node as never,
        messageId: "oneParameterPerLine",
        fix: fixes.length > 0 ? fix : undefined,
    });
}

const rule: Rule.RuleModule = {
    meta: {
        type: "layout",
        docs: {
            description: "Require one function parameter per line",
        },
        fixable: "whitespace",
        schema: [],
        messages: {
            oneParameterPerLine: "Each function parameter must be on its own line.",
        },
    },
    create(context) {
        return Object.fromEntries(
            functionNodeTypes.map((nodeType) => [
                nodeType,
                (node: unknown) => checkFunctionParameters(context, node),
            ]),
        );
    },
};

export default rule;
