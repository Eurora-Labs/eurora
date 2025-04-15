#!/bin/bash

set -o errexit
set -o nounset
set -o pipefail

PWD="$(dirname "$(readlink -f -- "$0")")"

CHANNEL=""
DO_SIGN="false"
VERSION=""

function help() {
	local to
	to="$1"

	echo "Usage: $0 <flags>" 1>&"$to"
	echo 1>&"$to"
	echo "flags:" 1>&"$to"
	echo "	--version											release version." 1>&"$to"
	echo "	--dist												path to store artifacts in." 1>&"$to"
	echo "	--sign												if set, will sign the app." 1>&"$to"
	echo "	--channel											the channel to use for the release (release | nightly)." 1>&"$to"
	echo "	--help												display this message." 1>&"$to"
}

function error() {
	echo "error: $*" 1>&2
	echo 1>&2
	help 2
	exit 1
}

function info() {
	echo "$@"
}

function os() {
	local os
	os="$(uname -s)"
	case "$os" in
	Darwin)
		echo "macos"
		;;
	Linux)
		echo "linux"
		;;
	Windows | MSYS* | MINGW*)
		echo "windows"
		;;
	*)
		error "$os: unsupported"
		;;
	esac
}

function arch() {
	local arch
	arch="$(uname -m)"
	case "$arch" in
	arm64 | aarch64)
		echo "aarch64"
		;;
	x86_64)
		echo "x86_64"
		;;
	*)
		error "$arch: unsupported architecture"
		;;
	esac
}

ARCH="$(arch)"
OS="$(os)"
DIST="release"

function tauri() {
	(cd "$PWD/.." && pnpm tauri "$@")
}

while [[ $# -gt 0 ]]; do
	case "$1" in
	--help)
		help 1
		exit 1
		;;
	--version)
		VERSION="$2"
		shift
		shift
		;;
	--dist)
		DIST="$2"
		shift
		shift
		;;
	--sign)
		DO_SIGN="true"
		shift
		;;
	--channel)
		CHANNEL="$2"
		shift
		shift
		;;
	*)
		error "unknown flag $1"
		;;
	esac
done

[ -z "${VERSION-}" ] && error "--version is not set"

[ -z "${TAURI_SIGNING_PRIVATE_KEY-}" ] && error "$TAURI_SIGNING_PRIVATE_KEY is not set"
[ -z "${TAURI_SIGNING_PRIVATE_KEY_PASSWORD-}" ] && error "$TAURI_SIGNING_PRIVATE_KEY_PASSWORD is not set"

if [ "$CHANNEL" != "release" ] && [ "$CHANNEL" != "nightly" ]; then
	error "--channel must be either 'release' or 'nightly'"
fi

if [ "$DO_SIGN" = "true" ]; then
	if [ "$OS" = "macos" ]; then
		[ -z "${APPLE_CERTIFICATE-}" ] && error "$APPLE_CERTIFICATE is not set"
		[ -z "${APPLE_CERTIFICATE_PASSWORD-}" ] && error "$APPLE_CERTIFICATE_PASSWORD is not set"
		[ -z "${APPLE_ID-}" ] && error "$APPLE_ID is not set"
		[ -z "${APPLE_TEAM_ID-}" ] && error "$APPLE_TEAM_ID is not set"
		[ -z "${APPLE_PASSWORD-}" ] && error "$APPLE_PASSWORD is not set"
		export APPLE_CERTIFICATE="$APPLE_CERTIFICATE"
		export APPLE_CERTIFICATE_PASSWORD="$APPLE_CERTIFICATE_PASSWORD"
		export APPLE_ID="$APPLE_ID"
		export APPLE_TEAM_ID="$APPLE_TEAM_ID"
		export APPLE_PASSWORD="$APPLE_PASSWORD"
	elif [ "$OS" == "linux" ]; then
		[ -z "${APPIMAGE_KEY_ID-}" ] && error "$APPIMAGE_KEY_ID is not set"
		[ -z "${APPIMAGE_KEY_PASSPHRASE-}" ] && error "$APPIMAGE_KEY_PASSPHRASE is not set"
		export SIGN=1
		export SIGN_KEY="$APPIMAGE_KEY_ID"
		export APPIMAGETOOL_SIGN_PASSPHRASE="$APPIMAGE_KEY_PASSPHRASE"
	elif [ "$OS" == "windows" ]; then
		# Nothing to do on windows
		:
	else
		error "signing is not supported on $(uname -s)"
	fi
fi

info "building:"
info "	channel: $CHANNEL"
info "	version: $VERSION"
info "	os: $OS"
info "	arch: $ARCH"
info "	dist: $DIST"
info "	sign: $DO_SIGN"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' exit

CONFIG_PATH=$(readlink -f "$PWD/../crates/app/eur-tauri/tauri.conf.$CHANNEL.json")

# update the version in the tauri release config
jq '.version="'"$VERSION"'"' "$CONFIG_PATH" >"$TMP_DIR/tauri.conf.json"

if [ "$OS" = "windows" ]; then
	FEATURES="windows"
else
	FEATURES=""
fi

# Experimental build of all packages

# build the app with release config
tauri build \
	--verbose \
	--features "$FEATURES" \
	--config "$TMP_DIR/tauri.conf.json"

BUNDLE_DIR=$(readlink -f "$PWD/../target/release/bundle")
RELEASE_DIR="$DIST/$OS/$ARCH"
mkdir -p "$RELEASE_DIR"

if [ "$OS" = "macos" ]; then
	MACOS_DMG="$(find "$BUNDLE_DIR/dmg" -depth 1 -type f -name "*.dmg")"
	MACOS_UPDATER="$(find "$BUNDLE_DIR/macos" -depth 1 -type f -name "*.tar.gz")"
	MACOS_UPDATER_SIG="$(find "$BUNDLE_DIR/macos" -depth 1 -type f -name "*.tar.gz.sig")"

	cp "$MACOS_DMG" "$RELEASE_DIR"
	cp "$MACOS_UPDATER" "$RELEASE_DIR"
	cp "$MACOS_UPDATER_SIG" "$RELEASE_DIR"

	info "built:"
	info "	- $RELEASE_DIR/$(basename "$MACOS_DMG")"
	info "	- $RELEASE_DIR/$(basename "$MACOS_UPDATER")"
	info "	- $RELEASE_DIR/$(basename "$MACOS_UPDATER_SIG")"
elif [ "$OS" = "linux" ]; then
	APPIMAGE="$(find "$BUNDLE_DIR/appimage" -name \*.AppImage)"
	APPIMAGE_UPDATER="$(find "$BUNDLE_DIR/appimage" -name \*.AppImage.tar.gz)"
	APPIMAGE_UPDATER_SIG="$(find "$BUNDLE_DIR/appimage" -name \*.AppImage.tar.gz.sig)"
	DEB="$(find "$BUNDLE_DIR/deb" -name \*.deb)"
	RPM="$(find "$BUNDLE_DIR/rpm" -name \*.rpm)"

	cp "$APPIMAGE" "$RELEASE_DIR"
	cp "$APPIMAGE_UPDATER" "$RELEASE_DIR"
	cp "$APPIMAGE_UPDATER_SIG" "$RELEASE_DIR"
	cp "$DEB" "$RELEASE_DIR"
	cp "$RPM" "$RELEASE_DIR"

	info "built:"
	info "	- $RELEASE_DIR/$(basename "$APPIMAGE")"
	info "	- $RELEASE_DIR/$(basename "$APPIMAGE_UPDATER")"
	info "	- $RELEASE_DIR/$(basename "$APPIMAGE_UPDATER_SIG")"
	info "	- $RELEASE_DIR/$(basename "$DEB")"
	info "	- $RELEASE_DIR/$(basename "$RPM")"
elif [ "$OS" = "windows" ]; then
	WINDOWS_INSTALLER="$(find "$BUNDLE_DIR/msi" -name \*.msi)"
	WINDOWS_UPDATER="$(find "$BUNDLE_DIR/msi" -name \*.msi.zip)"
	WINDOWS_UPDATER_SIG="$(find "$BUNDLE_DIR/msi" -name \*.msi.zip.sig)"

	cp "$WINDOWS_INSTALLER" "$RELEASE_DIR"
	
	# Uncomment and adapt if you have auxiliary binaries to include
	# mkdir -p tauri-aux-artifacts
	# cp target/release/eur-aux-binary.exe tauri-aux-artifacts/
	cp "$WINDOWS_UPDATER" "$RELEASE_DIR"
	cp "$WINDOWS_UPDATER_SIG" "$RELEASE_DIR"

	info "built:"
	info "	- $RELEASE_DIR/$(basename "$WINDOWS_INSTALLER")"
	info "	- $RELEASE_DIR/$(basename "$WINDOWS_UPDATER")"
	info "	- $RELEASE_DIR/$(basename "$WINDOWS_UPDATER_SIG")"
else
	error "unsupported os: $OS"
fi

# Install Chrome extension native messaging host manifest
function install_native_messaging_host() {
	info "Installing Chrome extension native messaging host manifest..."
	
	# Path to the native messaging host binary in the release
	local NATIVE_MESSAGING_HOST_BINARY
	local MANIFEST_DIR
	local MANIFEST_PATH
	local MANIFEST_CONTENT
	
	# Get the path to the native-messaging-host.json template
	local TEMPLATE_PATH="$PWD/../extensions/chromium/native-messaging-host.json"
	
	if [ "$OS" = "macos" ]; then
		# For macOS, the binary is inside the .app bundle
		NATIVE_MESSAGING_HOST_BINARY="/Applications/Eurora.app/Contents/MacOS/eur-native-messaging"
		MANIFEST_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
		
		# Also support Chromium and other browsers
		mkdir -p "$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
		mkdir -p "$HOME/Library/Application Support/Chromium/NativeMessagingHosts"
		mkdir -p "$HOME/Library/Application Support/Microsoft Edge/NativeMessagingHosts"
		mkdir -p "$HOME/Library/Application Support/BraveSoftware/Brave-Browser/NativeMessagingHosts"
		
	elif [ "$OS" = "linux" ]; then
		# For Linux, use the installed binary path
		NATIVE_MESSAGING_HOST_BINARY="/usr/bin/eur-native-messaging"
		MANIFEST_DIR="$HOME/.config/google-chrome/NativeMessagingHosts"
		
		# Also support Chromium and other browsers
		mkdir -p "$HOME/.config/google-chrome/NativeMessagingHosts"
		mkdir -p "$HOME/.config/chromium/NativeMessagingHosts"
		mkdir -p "$HOME/.config/microsoft-edge/NativeMessagingHosts"
		mkdir -p "$HOME/.config/BraveSoftware/Brave-Browser/NativeMessagingHosts"
		
	elif [ "$OS" = "windows" ]; then
		# For Windows, use the installed binary path
		NATIVE_MESSAGING_HOST_BINARY="C:\\Program Files\\Eurora\\eur-native-messaging.exe"
		# Windows uses registry instead of file system for manifest
		MANIFEST_DIR=""
	else
		error "Unsupported OS for native messaging host: $OS"
	fi
	
	# Create the manifest content with the correct binary path
	MANIFEST_CONTENT=$(cat "$TEMPLATE_PATH" | sed "s|\"path\": \".*\"|\"path\": \"$NATIVE_MESSAGING_HOST_BINARY\"|")
	
	if [ "$OS" = "macos" ] || [ "$OS" = "linux" ]; then
		# For macOS and Linux, write the manifest to the filesystem
		for browser_dir in "$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts" \
                            "$HOME/Library/Application Support/Chromium/NativeMessagingHosts" \
                            "$HOME/Library/Application Support/Microsoft Edge/NativeMessagingHosts" \
                            "$HOME/Library/Application Support/BraveSoftware/Brave-Browser/NativeMessagingHosts" \
                            "$HOME/.config/google-chrome/NativeMessagingHosts" \
                            "$HOME/.config/chromium/NativeMessagingHosts" \
                            "$HOME/.config/microsoft-edge/NativeMessagingHosts" \
                            "$HOME/.config/BraveSoftware/Brave-Browser/NativeMessagingHosts"; do
			if [ -d "$browser_dir" ]; then
				MANIFEST_PATH="$browser_dir/com.eurora.app.json"
				echo "$MANIFEST_CONTENT" > "$MANIFEST_PATH"
				info "  - Installed manifest to $MANIFEST_PATH"
			fi
		done
	elif [ "$OS" = "windows" ]; then
		# For Windows, we need to create registry entries
		# This would typically be done by the installer, but we'll include the commands here
		# Note: This requires administrative privileges to run
		
		# Define the manifest path
		local MANIFEST_PATH="C:\\Program Files\\Eurora\\com.eurora.app.json"
		
		# Add registry keys for Chrome, Chromium, Edge, and Brave
		info "  - Adding registry keys for native messaging host..."
		
		# For current user (HKCU)
		info "  - Adding registry key for Chrome (current user)..."
		cmd.exe /c "REG ADD \"HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\com.eurora.app\" /ve /t REG_SZ /d \"$MANIFEST_PATH\" /f"
		if [ $? -eq 0 ]; then
			info "    Successfully added Chrome registry key"
		else
			info "    Failed to add Chrome registry key"
		fi
		
		info "  - Adding registry key for Chromium (current user)..."
		cmd.exe /c "REG ADD \"HKCU\\Software\\Chromium\\NativeMessagingHosts\\com.eurora.app\" /ve /t REG_SZ /d \"$MANIFEST_PATH\" /f"
		if [ $? -eq 0 ]; then
			info "    Successfully added Chromium registry key"
		else
			info "    Failed to add Chromium registry key"
		fi
		
		info "  - Adding registry key for Microsoft Edge (current user)..."
		cmd.exe /c "REG ADD \"HKCU\\Software\\Microsoft\\Edge\\NativeMessagingHosts\\com.eurora.app\" /ve /t REG_SZ /d \"$MANIFEST_PATH\" /f"
		if [ $? -eq 0 ]; then
			info "    Successfully added Microsoft Edge registry key"
		else
			info "    Failed to add Microsoft Edge registry key"
		fi
		
		info "  - Adding registry key for Brave Browser (current user)..."
		cmd.exe /c "REG ADD \"HKCU\\Software\\BraveSoftware\\Brave-Browser\\NativeMessagingHosts\\com.eurora.app\" /ve /t REG_SZ /d \"$MANIFEST_PATH\" /f"
		if [ $? -eq 0 ]; then
			info "    Successfully added Brave Browser registry key"
		else
			info "    Failed to add Brave Browser registry key"
		fi
		
		# Note about system-wide installation
		info "  - Note: System-wide installation (HKLM) requires administrative privileges"
		info "    To add system-wide registry keys, run the following commands as administrator:"
		info "    REG ADD \"HKEY_LOCAL_MACHINE\\SOFTWARE\\Google\\Chrome\\NativeMessagingHosts\\com.eurora.app\" /ve /t REG_SZ /d \"$MANIFEST_PATH\" /f"
		info "    REG ADD \"HKEY_LOCAL_MACHINE\\SOFTWARE\\Chromium\\NativeMessagingHosts\\com.eurora.app\" /ve /t REG_SZ /d \"$MANIFEST_PATH\" /f"
		info "    REG ADD \"HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Edge\\NativeMessagingHosts\\com.eurora.app\" /ve /t REG_SZ /d \"$MANIFEST_PATH\" /f"
		info "    REG ADD \"HKEY_LOCAL_MACHINE\\SOFTWARE\\BraveSoftware\\Brave-Browser\\NativeMessagingHosts\\com.eurora.app\" /ve /t REG_SZ /d \"$MANIFEST_PATH\" /f"
		# Create the manifest file in the installation directory
		info "  - Creating manifest file at: $MANIFEST_PATH"
		
		# Get the path to the native-messaging-host.json template
		local TEMPLATE_PATH="$PWD/../extensions/chromium/native-messaging-host.json"
		
		# Create the manifest content with the correct binary path for Windows
		local WINDOWS_BINARY_PATH="C:\\Program Files\\Eurora\\eur-native-messaging.exe"
		local MANIFEST_CONTENT=$(cat "$TEMPLATE_PATH" | sed "s|\"path\": \".*\"|\"path\": \"$WINDOWS_BINARY_PATH\"|")
		
		# Create a temporary file with the manifest content
		echo "$MANIFEST_CONTENT" > "$TMP_DIR/com.eurora.app.json"
		
		# Copy the manifest file to the installation directory
		# Note: This would typically be done by the installer
		info "  - The manifest file content has been prepared and should be installed to:"
		info "    $MANIFEST_PATH"
		info "  - Manifest content:"
		info "$(cat "$TMP_DIR/com.eurora.app.json")"
		info "  - The manifest file should be placed at: $MANIFEST_PATH"
	fi
}

# Call the function to install the native messaging host
install_native_messaging_host

info "done! bye!"