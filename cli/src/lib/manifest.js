export function buildManifestItem({
  index,
  identifier,
  name,
  thumb,
  large,
  alt,
}) {
  return {
    index,
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
