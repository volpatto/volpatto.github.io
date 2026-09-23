import { readFile } from "node:fs/promises";
import { parseDocument } from "yaml";

export function parseSecurityPolicy(text) {
  if (Buffer.byteLength(text) > 65536)
    throw new Error("Security policy is too large");
  const document = parseDocument(text, { uniqueKeys: true });
  if (document.errors.length) throw new Error(document.errors[0].message);
  const policy = document.toJS({ maxAliasCount: 0 });
  const keys = (object, expected) =>
    object &&
    !Array.isArray(object) &&
    typeof object === "object" &&
    Object.keys(object).length === expected.length &&
    expected.every((key) => Object.hasOwn(object, key));
  if (
    !keys(policy, ["resources", "dependencies"]) ||
    !keys(policy.resources, ["allowedOrigins"]) ||
    !keys(policy.dependencies, ["failOn", "exceptions"])
  ) {
    throw new Error(
      "Invalid security-policy.yaml: expected resources.allowedOrigins and dependencies.failOn/exceptions",
    );
  }
  const origins = policy.resources.allowedOrigins;
  if (!Array.isArray(origins) || new Set(origins).size !== origins.length) {
    throw new Error("allowedOrigins must be a list of unique HTTPS origins");
  }
  for (const value of origins) {
    let url;
    try {
      url = new URL(value);
    } catch {
      /* Report the policy field below. */
    }
    if (
      typeof value !== "string" ||
      !url ||
      url.protocol !== "https:" ||
      url.origin !== value ||
      url.username ||
      url.password ||
      value.includes("*")
    ) {
      throw new Error(
        `Invalid allowedOrigins entry: ${value}. Use an exact HTTPS origin without a path.`,
      );
    }
  }
  return policy;
}

export async function loadSecurityPolicy(path = "security-policy.yaml") {
  return parseSecurityPolicy(await readFile(path, "utf8"));
}
