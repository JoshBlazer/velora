/**
 * Fails the build when the README falls behind the code.
 *
 * This drifted three times in a single day: a script was added, an
 * environment variable was introduced, a test suite grew -- and the README
 * kept claiming to document all of them. Every one of those was caught by
 * running these comparisons by hand, which only works if someone remembers.
 *
 *   node scripts/check-docs.mjs
 *
 * It checks three things:
 *   1. every npm script is mentioned in the README
 *   2. every process.env.* the app reads is documented
 *   3. the test counts the README advertises match reality
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const README = readFileSync("README.md", "utf8");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));

const problems = [];

/** Variables the framework or platform sets, which nobody configures. */
const INTERNAL_ENV = new Set(["NODE_ENV", "NEXT_RUNTIME", "VERCEL_ENV"]);

function walk(dir) {
    const out = [];
    for (const entry of readdirSync(dir)) {
        const path = join(dir, entry);
        if (statSync(path).isDirectory()) out.push(...walk(path));
        else if (/\.(ts|tsx|mjs|js)$/.test(path)) out.push(path);
    }
    return out;
}

// 1. npm scripts -------------------------------------------------------------

const undocumentedScripts = Object.keys(pkg.scripts ?? {}).filter(
    (name) => !README.includes(name)
);

if (undocumentedScripts.length) {
    problems.push(
        `These npm scripts are not mentioned in the README:\n` +
        undocumentedScripts.map((s) => `    ${s}`).join("\n")
    );
}

// 2. environment variables ---------------------------------------------------

const sources = [...walk("src"), ...walk("prisma")];
const referenced = new Set();

for (const file of sources) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(/process\.env\.([A-Z_][A-Z0-9_]*)/g)) {
        if (!INTERNAL_ENV.has(match[1])) referenced.add(match[1]);
    }
}

const undocumentedEnv = [...referenced].filter((name) => !README.includes(name));

if (undocumentedEnv.length) {
    problems.push(
        `These environment variables are read by the app but not documented ` +
        `in the README:\n` +
        undocumentedEnv.map((v) => `    ${v}`).join("\n")
    );
}

// 3. advertised test counts --------------------------------------------------

function countTests(dir, pattern) {
    return readdirSync(dir)
        .filter((f) => pattern.test(f))
        .reduce(
            (total, f) =>
                total + (readFileSync(join(dir, f), "utf8").match(/^\s*(it|test)\(/gm) ?? []).length,
            0
        );
}

const claims = [
    { label: "unit", actual: countTests("tests", /\.test\.ts$/), re: /\*\*(\d+) unit\*\*/ },
    { label: "end-to-end", actual: countTests("e2e", /\.spec\.ts$/), re: /\*\*(\d+) end-to-end\*\*/ },
];

for (const { label, actual, re } of claims) {
    const claimed = README.match(re)?.[1];

    if (claimed === undefined) {
        problems.push(`The README no longer states a ${label} test count.`);
    } else if (Number(claimed) !== actual) {
        problems.push(
            `The README claims ${claimed} ${label} tests, but there are ${actual}.`
        );
    }
}

// ----------------------------------------------------------------------------

if (problems.length) {
    console.error("README is out of date with the code:\n");
    for (const problem of problems) console.error(`  - ${problem}\n`);
    console.error("Update README.md, or adjust scripts/check-docs.mjs if the rule is wrong.");
    process.exit(1);
}

console.log("README is in step with the code.");
