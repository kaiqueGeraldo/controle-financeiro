import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const checkout = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
function physical(value: string): string {
  let parent = path.resolve(value);
  while (!fs.existsSync(parent)) { const next = path.dirname(parent); if (next === parent) throw new Error("No existing artifact ancestor"); parent = next; }
  return path.join(fs.realpathSync.native(parent), path.relative(parent, path.resolve(value)));
}
/** Explicit execution output wins; historical standalone defaults remain available. */
export function artifactDirectory(label: string, historical: string): string {
  const configured = process.env.CF_REVIEW_EVIDENCE ?? process.env.CF032_EVIDENCE ?? process.env.CF_TEST_ARTIFACTS;
  if (configured === undefined) return historical;
  if (!path.isAbsolute(configured)) throw new Error("Artifact root must be absolute");
  const root = physical(configured), source = physical(checkout);
  const relative = path.relative(source, root);
  if (!relative || (!path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(".." + path.sep)))
    throw new Error("Artifact root must be outside the source checkout");
  if (!/^[a-z0-9-]+$/.test(label)) throw new Error("Invalid artifact scope");
  return path.join(root, label);
}
