# Local object-construction patch

Source: lossless-json 4.3.0, lib/esm/parse.js and lib/esm/revive.js (MIT, LICENSE.md).
The upstream grammar, duplicate-key handling, number parser and LosslessNumber are unchanged.
The wrapper consumes exactly the same parse API/types. No handwritten JSON parser.

Only functional changes: the two dynamic object writes in parseObject and the write
in reviveObject use Object.defineProperty with enumerable/writable/configurable data
properties. Thus __proto__, constructor and hasOwnProperty are ordinary own data,
without invoking inherited setters. Ordinary Object.prototype is retained, matching
JSON.parse construction. Arrays retain Array.prototype and their original handling.
Imports of numeric helpers refer to the pinned public dependency; the local revive
import is retained. Source-map comments were removed because upstream maps no
longer describe the patch. parse.d.ts reuses the unchanged upstream signature.

Why local modules: published 4.3.1 was inspected and still used object[key] = value.
A dependency upgrade alone did not fix construction. A postinstall patch would
mutate node_modules, require install hooks and be bypassed by --ignore-scripts.
This small vendored surface is reproducible in CI and does not change global
prototypes, financial representation, dependencies, or other API parsers.

Maintenance cost: compare these two modules with upstream when upgrading the
pinned parser, retain the exact-member/decimal regressions, and remove the fork
only when a compatible upstream version passes them. Evidence and before hashes:
tasks/evidencias/saneamento-RVR24-01-propriedades/.
