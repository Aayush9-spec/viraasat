#!/usr/bin/env bash
set -euo pipefail
kit_dir="$(cd -- "$(dirname -- "$0")" && pwd)"
command -v java >/dev/null || { printf '%s\n' 'Java 17 or later is required.'; exit 1; }
read -r -p 'Full path to your private keystore: ' signing_keystore
[[ -f "$signing_keystore" ]] || { printf '%s\n' 'Keystore file not found.'; exit 1; }
read -r -p 'Key alias (leave blank if the keystore has only one key): ' signing_alias
signing_args=(-jar "$kit_dir/apksigner.jar" sign --ks "$signing_keystore"
  --v1-signing-enabled false --v2-signing-enabled true --v3-signing-enabled true
  --out "$kit_dir/viraasat-signed.apk")
if [[ -n "$signing_alias" ]]; then signing_args+=(--ks-key-alias "$signing_alias"); fi
printf '%s\n' 'Enter your passwords only at the Java signing prompts. They stay on this computer.'
java "${signing_args[@]}" "$kit_dir/viraasat-unsigned.apk"
java -jar "$kit_dir/apksigner.jar" verify --verbose --print-certs "$kit_dir/viraasat-signed.apk"
printf '%s\n' 'Return only viraasat-signed.apk for verification and publication. Keep your keystore and passwords private.'
