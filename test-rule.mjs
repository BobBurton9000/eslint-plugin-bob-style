import { ESLint } from "eslint";
import path from "node:path";

const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: {
        languageOptions: {
            parser: await import("@typescript-eslint/parser"),
            parserOptions: {
                project: false,
                ecmaVersion: "latest",
                sourceType: "module",
            },
        },
        plugins: {
            "bob-style": await import("/home/bob/Documents/Repo/eslint-plugin-bob-style/dist/index.js"),
        },
        rules: {
            "bob-style/no-anonymous-object-structures": "error",
        },
    },
});

const results = await eslint.lintFiles(["/tmp/opencode/test-rule.ts"]);
results[0].messages.forEach((msg) => {
    console.log(`Line ${msg.line}: ${msg.message}`);
});
console.log(`\nTotal errors: ${results[0].messages.length}\n`);

console.log("All messages:", JSON.stringify(results[0].messages, null, 2));
