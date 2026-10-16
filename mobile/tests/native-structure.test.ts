import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import ts from "typescript";

test("native view containers do not contain literal text children that crash iOS", () => {
  const violations: string[] = [];
  const containers = new Set([
    "View",
    "Pressable",
    "ScrollView",
    "SafeAreaView",
    "KeyboardAvoidingView",
  ]);
  function scan(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        scan(path);
        continue;
      }
      if (!path.endsWith(".tsx")) continue;
      const source = ts.createSourceFile(
        path,
        readFileSync(path, "utf8"),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      function visit(node: ts.Node) {
        if (
          path.endsWith(".ios.tsx") &&
          ts.isJsxElement(node) &&
          node.openingElement.tagName.getText(source) === "Link" &&
          node.children.some(
            (child) =>
              ts.isJsxElement(child) &&
              child.openingElement.tagName.getText(source) === "Link.Trigger",
          ) &&
          !node.openingElement.attributes.properties.some(
            (prop) =>
              ts.isJsxAttribute(prop) &&
              prop.name.getText(source) === "asChild" &&
              (!prop.initializer ||
                prop.initializer.getText(source) === "{true}"),
          )
        ) {
          const { line } = source.getLineAndCharacterOfPosition(
            node.getStart(source),
          );
          violations.push(
            `${path}:${line + 1}: Link.Trigger containing a native view needs Link asChild to avoid a Text wrapper`,
          );
        }
        if (
          ts.isJsxElement(node) &&
          containers.has(node.openingElement.tagName.getText(source))
        ) {
          for (const child of node.children) {
            const isText = ts.isJsxText(child) && child.text.trim().length > 0;
            const isLiteral =
              ts.isJsxExpression(child) &&
              child.expression &&
              ts.isStringLiteral(child.expression) &&
              child.expression.text.length > 0;
            if (isText || isLiteral) {
              const { line } = source.getLineAndCharacterOfPosition(
                child.getStart(source),
              );
              violations.push(`${path}:${line + 1}`);
            }
          }
        }
        ts.forEachChild(node, visit);
      }
      visit(source);
    }
  }
  scan(join(process.cwd(), "src"));
  assert.deepEqual(
    violations,
    [],
    `Invalid native view/text nesting: ${violations.join(", ")}`,
  );
});
