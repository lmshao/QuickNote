#!/usr/bin/env bash
set -euo pipefail

# QuickNote - Linux Release Build Script
# Usage:
#   ./scripts/build.sh
#   ./scripts/build.sh --install-deps
#   ./scripts/build.sh --target x86_64-unknown-linux-gnu --bundles appimage

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
START_TS="$(date +%s)"

TARGET=""
BUNDLES=""
INSTALL_DEPS="false"

log_title() { printf "\n%s\n" "$1"; }
log_step() { printf "  => %s\n" "$1"; }
log_ok() { printf "  [OK] %s\n" "$1"; }
log_warn() { printf "  [WARN] %s\n" "$1"; }
log_err() { printf "  [ERR] %s\n" "$1" >&2; }

print_usage() {
  cat <<'EOF'
QuickNote Linux build script

Options:
  --target <triple>      Rust target triple for tauri build
  --bundles <types>      Bundle types, e.g. appimage,deb or "all"
  --install-deps         Auto-install Ubuntu dependencies via apt-get
  -h, --help             Show this help message
EOF
}

while (($# > 0)); do
  case "$1" in
    --target)
      TARGET="${2:-}"
      shift 2
      ;;
    --bundles)
      BUNDLES="${2:-}"
      shift 2
      ;;
    --install-deps)
      INSTALL_DEPS="true"
      shift
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      log_err "Unknown option: $1"
      print_usage
      exit 1
      ;;
  esac
done

if [[ "$INSTALL_DEPS" == "true" ]] && ! command -v apt-get >/dev/null 2>&1; then
  log_err "--install-deps currently supports Ubuntu/Debian (apt-get) only."
  exit 1
fi

REQUIRED_TOOLS=(node npm cargo rustc pkg-config)
UBUNTU_PACKAGES=(
  build-essential
  pkg-config
  libgtk-3-dev
  libwebkit2gtk-4.1-dev
  libayatana-appindicator3-dev
  librsvg2-dev
  libssl-dev
)
REQUIRED_PKG_CONFIG_NAMES=(
  gdk-3.0
  cairo
  gdk-pixbuf-2.0
  pango
  gtk+-3.0
  webkit2gtk-4.1
)

log_title "========================================"
log_title "  QuickNote  -  Linux Release Build"
log_title "========================================"

log_title "[ 1/5 ] Checking CLI tools..."
for tool in "${REQUIRED_TOOLS[@]}"; do
  if command -v "$tool" >/dev/null 2>&1; then
    ver="$("$tool" --version 2>&1 | head -n 1)"
    log_ok "$tool: $ver"
  else
    log_err "$tool is not installed."
    exit 1
  fi
done

if [[ "$INSTALL_DEPS" == "true" ]]; then
  log_title "[ 2/5 ] Installing Ubuntu dependencies..."
  log_step "Running apt-get install for Tauri Linux dependencies"
  sudo apt-get update
  sudo apt-get install -y "${UBUNTU_PACKAGES[@]}"
  log_ok "System dependencies installed"
else
  log_title "[ 2/5 ] Checking Ubuntu system dependencies..."
  missing_pc=()
  for pc_name in "${REQUIRED_PKG_CONFIG_NAMES[@]}"; do
    if pkg-config --exists "$pc_name"; then
      log_ok "pkg-config: $pc_name"
    else
      missing_pc+=("$pc_name")
    fi
  done

  if ((${#missing_pc[@]} > 0)); then
    log_err "Missing pkg-config packages: ${missing_pc[*]}"
    log_warn "Install dependencies on Ubuntu with:"
    printf "  sudo apt-get update && sudo apt-get install -y %s\n" "${UBUNTU_PACKAGES[*]}"
    exit 1
  fi
fi

log_title "[ 3/5 ] Checking Node dependencies..."
cd "$ROOT_DIR"
if [[ ! -d node_modules ]]; then
  log_step "node_modules not found, running npm install --include=dev"
  npm install --include=dev
  log_ok "Node dependencies installed"
else
  log_ok "node_modules already present"
fi

if [[ ! -x "$ROOT_DIR/node_modules/.bin/tauri" ]]; then
  log_step "tauri CLI not found locally, installing dev dependencies"
  npm install --include=dev
fi
if [[ ! -x "$ROOT_DIR/node_modules/.bin/tauri" ]]; then
  log_err "Local tauri CLI is missing at node_modules/.bin/tauri"
  exit 1
fi
log_ok "Tauri CLI ready"

log_title "[ 4/5 ] Running tauri build..."
build_cmd=(npm run tauri build)
if [[ -n "$TARGET" || -n "$BUNDLES" ]]; then
  build_cmd+=(--)
  [[ -n "$TARGET" ]] && build_cmd+=(--target "$TARGET")
  [[ -n "$BUNDLES" ]] && build_cmd+=(--bundles "$BUNDLES")
fi
log_step "Command: ${build_cmd[*]}"
"${build_cmd[@]}"
log_ok "Build finished"

log_title "[ 5/5 ] Listing build artifacts..."
bundle_dir="$ROOT_DIR/src-tauri/target/release/bundle"
if [[ -d "$bundle_dir" ]]; then
  shopt -s nullglob globstar
  artifacts=(
    "$bundle_dir"/**/*.deb
    "$bundle_dir"/**/*.AppImage
    "$bundle_dir"/**/*.rpm
    "$bundle_dir"/**/*.tar.gz
    "$bundle_dir"/**/*.zip
  )
  shopt -u nullglob globstar

  if ((${#artifacts[@]} == 0)); then
    log_warn "No installer artifacts found in $bundle_dir"
  else
    for artifact in "${artifacts[@]}"; do
      size="$(du -h "$artifact" | awk '{print $1}')"
      printf "  - %s (%s)\n" "$artifact" "$size"
    done
  fi
else
  log_warn "Bundle directory not found: $bundle_dir"
fi

elapsed="$(( $(date +%s) - START_TS ))"
printf "\nTotal time: %ss\n" "$elapsed"
