import fs from "node:fs";
import path from "node:path";

/** @param {string} value @returns {string} */
function physical(value) {
  let parent = path.resolve(value);
  while (!fs.existsSync(parent)) {
    const next = path.dirname(parent);
    if (next === parent) throw new Error("No existing artifact ancestor");
    parent = next;
  }
  return path.join(fs.realpathSync.native(parent), path.relative(parent, path.resolve(value)));
}
/** @param {string} label @param {string} historical @returns {string} */
export function artifactDirectory(label, historical) {
  const configured = process.env.CF_REVIEW_EVIDENCE ?? process.env.CF032_EVIDENCE ?? process.env.CF_TEST_ARTIFACTS;
  if (configured === undefined) return historical;
  if (!path.isAbsolute(configured)) throw new Error("Artifact root must be absolute");
  const checkout = process.env.CF_SOURCE_ROOT ?? path.resolve(process.cwd(), "..");
  const root = physical(configured), source = physical(checkout);
  const relative = path.relative(source, root);
  if (!relative || (!path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(".." + path.sep)))
    throw new Error("Artifact root must be outside the source checkout");
  if (!/^[a-z0-9-]+$/.test(label)) throw new Error("Invalid artifact scope");
  return path.join(root, label);
}
