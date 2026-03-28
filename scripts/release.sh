#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-}"

if [[ -z "$VERSION" ]]; then
  echo "Usage: yarn release <version>"
  echo "Example: yarn release 0.0.4"
  exit 1
fi

if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: version must be semver (e.g. 0.0.4)"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "Bumping all packages to v${VERSION}..."

# npm packages
for PKG in core platform-web codegen capacitor platform-ios platform-android; do
  PKG_JSON="${ROOT}/packages/${PKG}/package.json"
  if [[ -f "$PKG_JSON" ]]; then
    sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"${VERSION}\"/" "$PKG_JSON"
    echo "  packages/${PKG}/package.json -> ${VERSION}"
  fi
done

# Android build.gradle
GRADLE="${ROOT}/packages/platform-android/build.gradle"
if [[ -f "$GRADLE" ]]; then
  sed -i '' "s/version = '[^']*'/version = '${VERSION}'/" "$GRADLE"
  echo "  packages/platform-android/build.gradle -> ${VERSION}"
fi

# Capacitor Android build.gradle (has its own version via plugin)
CAP_GRADLE="${ROOT}/packages/capacitor/android/build.gradle"
if grep -q "^version " "$CAP_GRADLE" 2>/dev/null; then
  sed -i '' "s/version = '[^']*'/version = '${VERSION}'/" "$CAP_GRADLE"
  echo "  packages/capacitor/android/build.gradle -> ${VERSION}"
fi

echo ""
echo "Done. Next steps:"
echo "  git add -A && git commit -m 'chore: bump all packages to v${VERSION}'"
echo "  git tag v${VERSION}"
echo "  git push origin main --tags"
