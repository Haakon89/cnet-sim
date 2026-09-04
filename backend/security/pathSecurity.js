// security/pathSecurity.js
import fs from "fs/promises";
import path from "path";

export function isValidSimpleName(name) {
  return (
    typeof name === "string" &&
    /^[a-zA-Z0-9_-]+$/.test(name)
  );
}

export function assertValidSimpleName(name) {
  if (!isValidSimpleName(name)) {
    const err = new Error("Invalid name");
    err.code = "INVALID_PATH";
    throw err;
  }
}

export async function resolveSafeFilePath(
  rootDir,
  filename
) {
  const resolvedRoot = path.resolve(rootDir);
  const canonicalRoot = await fs.realpath(
    resolvedRoot
  );

  const candidatePath = path.resolve(
    canonicalRoot,
    filename
  );

  const relativePath = path.relative(
    canonicalRoot,
    candidatePath
  );

  if (
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    const err = new Error("Invalid path");
    err.code = "INVALID_PATH";
    throw err;
  }

  try {
    const canonicalCandidate =
      await fs.realpath(candidatePath);

    const canonicalRelativePath = path.relative(
      canonicalRoot,
      canonicalCandidate
    );

    if (
      canonicalRelativePath.startsWith("..") ||
      path.isAbsolute(canonicalRelativePath)
    ) {
      const err = new Error("Invalid path");
      err.code = "INVALID_PATH";
      throw err;
    }

    return canonicalCandidate;
  } catch (err) {
    if (err.code === "INVALID_PATH") {
      throw err;
    }

    // File does not exist yet, which is valid when
    // creating a new file.
    if (err.code === "ENOENT") {
      return candidatePath;
    }

    throw err;
  }
}