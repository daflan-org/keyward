#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Read current version from core package
CURRENT=$(grep -m1 '"version"' "${ROOT}/packages/core/package.json" | sed 's/.*"version": "\([^"]*\)".*/\1/')

IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"

ARG="${1:-}"

case "$ARG" in
  patch)  PATCH=$((PATCH + 1)) ;;
  minor)  MINOR=$((MINOR + 1)); PATCH=0 ;;
  major)  MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
  "")
    # Default: suggest patch bump and ask for confirmation
    PATCH=$((PATCH + 1))
    VERSION="${MAJOR}.${MINOR}.${PATCH}"
    echo "Current version: v${CURRENT}"
    echo ""
    printf "Release v${VERSION}? [Y/n/version]: "
    read -r REPLY
    case "$REPLY" in
      ""|[Yy]|[Yy]es) ;; # proceed with patch
      [Nn]|[Nn]o) echo "Aborted."; exit 0 ;;
      *)
        if [[ ! "$REPLY" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
          echo "Error: must be semver (e.g. 0.1.0)"
          exit 1
        fi
        IFS='.' read -r MAJOR MINOR PATCH <<< "$REPLY"
        ;;
    esac
    ;;
  *)
    if [[ ! "$ARG" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
      echo "Error: version must be patch, minor, major, or semver (e.g. 0.1.0)"
      exit 1
    fi
    IFS='.' read -r MAJOR MINOR PATCH <<< "$ARG"
    ;;
esac

VERSION="${MAJOR}.${MINOR}.${PATCH}"

echo ""
echo "Bumping all packages: v${CURRENT} -> v${VERSION}"
echo ""

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
