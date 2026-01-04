export function buildManifestItem({ identifier, name, thumb, large, alt }) {
  return {
    identifier,
    name,
    thumb,
    large,
    alt,
  };
}

export function finalizeManifest(items) {
  return {
    version: new Date().toISOString(),
    items,
  };
}
