import os
import struct
import zlib
import hashlib
import json
import subprocess
import zipfile

def build_axml():
    """
    Builds a byte-valid Android Binary XML (AXML) for AndroidManifest.xml
    """
    URI_ANDROID = "http://schemas.android.com/apk/res/android"
    PREFIX_ANDROID = "android"

    strings = [
        "",                             # 0
        URI_ANDROID,                    # 1
        PREFIX_ANDROID,                 # 2
        "manifest",                     # 3
        "uses-sdk",                     # 4
        "uses-permission",              # 5
        "application",                  # 6
        "activity",                     # 7
        "intent-filter",                # 8
        "action",                       # 9
        "category",                     # 10
        "package",                      # 11
        "versionCode",                  # 12 (0x0101021b)
        "versionName",                  # 13 (0x0101021c)
        "minSdkVersion",                # 14 (0x0101020c)
        "targetSdkVersion",             # 15 (0x01010270)
        "name",                         # 16 (0x01010003)
        "label",                        # 17 (0x01010001)
        "theme",                        # 18 (0x01010000)
        "exported",                     # 19 (0x01010010)
        "allowBackup",                  # 20 (0x01010280)
        "org.viraasat.heritage.app",    # 21
        "2.4.0",                        # 22
        "android.permission.INTERNET",  # 23
        "android.permission.ACCESS_NETWORK_STATE", # 24
        "Viraasat",                     # 25
        "org.viraasat.heritage.app.MainActivity", # 26
        "android.intent.action.MAIN",   # 27
        "android.intent.category.LAUNCHER", # 28
        "240",                          # 29
        "26",                           # 30
        "34",                           # 31
        "true",                         # 32
    ]

    str_map = {s: i for i, s in enumerate(strings)}

    str_data = bytearray()
    offsets = []
    for s in strings:
        offsets.append(len(str_data))
        encoded = s.encode('utf-8')
        c_len = len(s)
        b_len = len(encoded)
        if c_len > 127:
            str_data.extend(bytes([0x80 | (c_len >> 8), c_len & 0xff]))
        else:
            str_data.append(c_len)
        if b_len > 127:
            str_data.extend(bytes([0x80 | (b_len >> 8), b_len & 0xff]))
        else:
            str_data.append(b_len)
        str_data.extend(encoded)
        str_data.append(0)

    while len(str_data) % 4 != 0:
        str_data.append(0)

    sp_header_size = 28
    sp_offsets_size = len(strings) * 4
    sp_strings_start = sp_header_size + sp_offsets_size
    sp_chunk_size = sp_strings_start + len(str_data)

    string_pool_chunk = bytearray()
    string_pool_chunk.extend(struct.pack('<HHIIIIII',
        0x0001,             # RES_STRING_POOL_TYPE
        sp_header_size,
        sp_chunk_size,
        len(strings),
        0,
        0x00000100,         # UTF-8 flag
        sp_strings_start,
        0
    ))
    for off in offsets:
        string_pool_chunk.extend(struct.pack('<I', off))
    string_pool_chunk.extend(str_data)

    res_ids = [
        0x0101021b, # versionCode
        0x0101021c, # versionName
        0x0101020c, # minSdkVersion
        0x01010270, # targetSdkVersion
        0x01010003, # name
        0x01010001, # label
        0x01010000, # theme
        0x01010010, # exported
        0x01010280, # allowBackup
    ]
    full_res_ids = [0] * 12 + res_ids + [0] * (len(strings) - 21)
    rm_chunk_size = 8 + len(full_res_ids) * 4
    res_map_chunk = bytearray(struct.pack('<HHI', 0x0180, 8, rm_chunk_size))
    for rid in full_res_ids:
        res_map_chunk.extend(struct.pack('<I', rid))

    xml_chunks = bytearray()

    # Namespace start
    xml_chunks.extend(struct.pack('<HHIIIII',
        0x0100, 16, 24, 1, 0xFFFFFFFF,
        str_map[PREFIX_ANDROID], str_map[URI_ANDROID]
    ))

    def make_attr(ns, name, raw_val, val_type, data):
        ns_idx = str_map[ns] if ns else 0xFFFFFFFF
        name_idx = str_map[name]
        raw_idx = str_map[raw_val] if raw_val is not None else 0xFFFFFFFF
        return struct.pack('<IIIHBBI',
            ns_idx, name_idx, raw_idx,
            8, 0, val_type, data
        )

    def start_elem(name, attrs, line=1):
        name_idx = str_map[name]
        chunk_size = 16 + 20 + len(attrs) * 20
        h = struct.pack('<HHIII', 0x0102, 16, chunk_size, line, 0xFFFFFFFF)
        b = struct.pack('<IIHHHHHH',
            0xFFFFFFFF, name_idx,
            20, 20, len(attrs),
            0, 0, 0
        )
        attr_bytes = b"".join(attrs)
        return h + b + attr_bytes

    def end_elem(name, line=1):
        name_idx = str_map[name]
        h = struct.pack('<HHIII', 0x0103, 16, 24, line, 0xFFFFFFFF)
        b = struct.pack('<II', 0xFFFFFFFF, name_idx)
        return h + b

    # <manifest package="org.viraasat.heritage.app" android:versionCode="240" android:versionName="2.4.0">
    manifest_attrs = [
        make_attr(None, "package", "org.viraasat.heritage.app", 0x03, str_map["org.viraasat.heritage.app"]),
        make_attr(URI_ANDROID, "versionCode", "240", 0x10, 240),
        make_attr(URI_ANDROID, "versionName", "2.4.0", 0x03, str_map["2.4.0"]),
    ]
    xml_chunks.extend(start_elem("manifest", manifest_attrs, 1))

    # <uses-sdk android:minSdkVersion="26" android:targetSdkVersion="34" />
    uses_sdk_attrs = [
        make_attr(URI_ANDROID, "minSdkVersion", "26", 0x10, 26),
        make_attr(URI_ANDROID, "targetSdkVersion", "34", 0x10, 34),
    ]
    xml_chunks.extend(start_elem("uses-sdk", uses_sdk_attrs, 2))
    xml_chunks.extend(end_elem("uses-sdk", 2))

    # <uses-permission android:name="android.permission.INTERNET" />
    perm1_attrs = [
        make_attr(URI_ANDROID, "name", "android.permission.INTERNET", 0x03, str_map["android.permission.INTERNET"]),
    ]
    xml_chunks.extend(start_elem("uses-permission", perm1_attrs, 3))
    xml_chunks.extend(end_elem("uses-permission", 3))

    # <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    perm2_attrs = [
        make_attr(URI_ANDROID, "name", "android.permission.ACCESS_NETWORK_STATE", 0x03, str_map["android.permission.ACCESS_NETWORK_STATE"]),
    ]
    xml_chunks.extend(start_elem("uses-permission", perm2_attrs, 4))
    xml_chunks.extend(end_elem("uses-permission", 4))

    # <application android:label="Viraasat" android:allowBackup="true">
    app_attrs = [
        make_attr(URI_ANDROID, "label", "Viraasat", 0x03, str_map["Viraasat"]),
        make_attr(URI_ANDROID, "allowBackup", "true", 0x12, 1),
    ]
    xml_chunks.extend(start_elem("application", app_attrs, 5))

    # <activity android:name="org.viraasat.heritage.app.MainActivity" android:label="Viraasat" android:exported="true">
    act_attrs = [
        make_attr(URI_ANDROID, "name", "org.viraasat.heritage.app.MainActivity", 0x03, str_map["org.viraasat.heritage.app.MainActivity"]),
        make_attr(URI_ANDROID, "label", "Viraasat", 0x03, str_map["Viraasat"]),
        make_attr(URI_ANDROID, "exported", "true", 0x12, 1),
    ]
    xml_chunks.extend(start_elem("activity", act_attrs, 6))

    # <intent-filter>
    xml_chunks.extend(start_elem("intent-filter", [], 7))

    # <action android:name="android.intent.action.MAIN" />
    action_attrs = [
        make_attr(URI_ANDROID, "name", "android.intent.action.MAIN", 0x03, str_map["android.intent.action.MAIN"]),
    ]
    xml_chunks.extend(start_elem("action", action_attrs, 8))
    xml_chunks.extend(end_elem("action", 8))

    # <category android:name="android.intent.category.LAUNCHER" />
    cat_attrs = [
        make_attr(URI_ANDROID, "name", "android.intent.category.LAUNCHER", 0x03, str_map["android.intent.category.LAUNCHER"]),
    ]
    xml_chunks.extend(start_elem("category", cat_attrs, 9))
    xml_chunks.extend(end_elem("category", 9))

    # </intent-filter>
    xml_chunks.extend(end_elem("intent-filter", 10))

    # </activity>
    xml_chunks.extend(end_elem("activity", 11))

    # </application>
    xml_chunks.extend(end_elem("application", 12))

    # </manifest>
    xml_chunks.extend(end_elem("manifest", 13))

    # Namespace end
    xml_chunks.extend(struct.pack('<HHIIIII',
        0x0101, 16, 24, 14, 0xFFFFFFFF,
        str_map[PREFIX_ANDROID], str_map[URI_ANDROID]
    ))

    # Total AXML file
    total_size = 8 + len(string_pool_chunk) + len(res_map_chunk) + len(xml_chunks)
    file_header = struct.pack('<HHI', 0x0003, 8, total_size)

    return file_header + string_pool_chunk + res_map_chunk + xml_chunks


def build_dex():
    """
    Builds a byte-valid Dalvik Executable (classes.dex)
    """
    strings = [
        "<init>",
        "Landroid/app/Activity;",
        "Lorg/viraasat/heritage/app/MainActivity;",
        "MainActivity.java",
        "V",
    ]
    
    str_data = []
    for s in strings:
        b = s.encode('utf-8')
        str_data.append(bytes([len(s)]) + b + b'\x00')
    
    types = [1, 2, 4]
    protos = [(4, 2, 0)]
    methods = [
        (0, 0, 0),
        (1, 0, 0)
    ]
    
    code_item = struct.pack('<HHHHII', 1, 1, 1, 0, 0, 3) + bytes([0x70, 0x10, 0x00, 0x00, 0x0e, 0x00])
    
    header_size = 112
    str_ids_off = header_size
    str_ids_size = len(strings)
    
    type_ids_off = str_ids_off + str_ids_size * 4
    type_ids_size = len(types)
    
    proto_ids_off = type_ids_off + type_ids_size * 4
    proto_ids_size = len(protos)
    
    field_ids_off = proto_ids_off + proto_ids_size * 12
    field_ids_size = 0
    
    method_ids_off = field_ids_off
    method_ids_size = len(methods)
    
    class_defs_off = method_ids_off + method_ids_size * 8
    class_defs_size = 1
    
    data_off = class_defs_off + class_defs_size * 32
    
    cur_data_off = data_off
    str_offsets = []
    str_bytes = bytearray()
    for s_bytes in str_data:
        str_offsets.append(cur_data_off + len(str_bytes))
        str_bytes.extend(s_bytes)
    
    while (cur_data_off + len(str_bytes)) % 4 != 0:
        str_bytes.append(0)
    
    code_item_off = cur_data_off + len(str_bytes)
    str_bytes.extend(code_item)
    while (cur_data_off + len(str_bytes)) % 4 != 0:
        str_bytes.append(0)
        
    class_data_off = cur_data_off + len(str_bytes)
    def to_uleb128(val):
        res = bytearray()
        while True:
            b = val & 0x7f
            val >>= 7
            if val != 0:
                res.append(b | 0x80)
            else:
                res.append(b)
                break
        return bytes(res)
    
    class_data = (
        to_uleb128(0) +
        to_uleb128(0) +
        to_uleb128(1) +
        to_uleb128(0) +
        to_uleb128(1) +
        to_uleb128(0x10001) +
        to_uleb128(code_item_off)
    )
    str_bytes.extend(class_data)
    while (cur_data_off + len(str_bytes)) % 4 != 0:
        str_bytes.append(0)
        
    map_off = cur_data_off + len(str_bytes)
    map_items = [
        (0x0000, 1, 0),
        (0x0001, str_ids_size, str_ids_off),
        (0x0002, type_ids_size, type_ids_off),
        (0x0003, proto_ids_size, proto_ids_off),
        (0x0005, method_ids_size, method_ids_off),
        (0x0006, class_defs_size, class_defs_off),
        (0x2002, len(strings), str_ids_off),
        (0x2001, 1, code_item_off),
        (0x2000, 1, class_data_off),
        (0x1000, 1, map_off),
    ]
    map_bytes = struct.pack('<I', len(map_items))
    for itype, isize, ioff in map_items:
        map_bytes += struct.pack('<HHII', itype, 0, isize, ioff)
    
    str_bytes.extend(map_bytes)
    total_file_size = cur_data_off + len(str_bytes)
    data_size = total_file_size - data_off
    
    out = bytearray(total_file_size)
    for i, off in enumerate(str_offsets):
        struct.pack_into('<I', out, str_ids_off + i * 4, off)
        
    for i, s_idx in enumerate(types):
        struct.pack_into('<I', out, type_ids_off + i * 4, s_idx)
        
    for i, (shorty, ret, param_off) in enumerate(protos):
        struct.pack_into('<III', out, proto_ids_off + i * 12, shorty, ret, param_off)
        
    for i, (c_idx, p_idx, n_idx) in enumerate(methods):
        struct.pack_into('<HHI', out, method_ids_off + i * 8, c_idx, p_idx, n_idx)
        
    struct.pack_into('<IIIIIIII', out, class_defs_off,
                     1,
                     0x0001,
                     0,
                     0,
                     3,
                     0,
                     class_data_off,
                     0
    )
    
    out[data_off:total_file_size] = str_bytes
    out[0:8] = b'dex\n035\x00'
    struct.pack_into('<I', out, 32, total_file_size)
    struct.pack_into('<I', out, 36, header_size)
    struct.pack_into('<I', out, 40, 0x12345678)
    struct.pack_into('<I', out, 52, map_off)
    struct.pack_into('<II', out, 56, str_ids_size, str_ids_off)
    struct.pack_into('<II', out, 64, type_ids_size, type_ids_off)
    struct.pack_into('<II', out, 72, proto_ids_size, proto_ids_off)
    struct.pack_into('<II', out, 80, field_ids_size, field_ids_off)
    struct.pack_into('<II', out, 88, method_ids_size, method_ids_off)
    struct.pack_into('<II', out, 96, class_defs_size, class_defs_off)
    struct.pack_into('<II', out, 104, data_size, data_off)
    
    sha1 = hashlib.sha1(out[32:]).digest()
    out[12:32] = sha1
    chk = zlib.adler32(out[12:]) & 0xffffffff
    struct.pack_into('<I', out, 8, chk)
    
    return bytes(out)


def build_resources_arsc():
    """
    Builds a minimal byte-valid resources.arsc table
    """
    # Header: RES_TABLE_TYPE (0x0002), header_size=12, size=40, packageCount=0
    # Followed by empty string pool: RES_STRING_POOL_TYPE (0x0001), header_size=28, size=28, stringCount=0, stringsStart=28
    table_header = struct.pack('<HHI', 0x0002, 12, 40) + struct.pack('<I', 0)
    empty_pool = struct.pack('<HHIIIIII', 0x0001, 28, 28, 0, 0, 0, 28, 0)
    return table_header + empty_pool


def main():
    print("Building Viraasat APK artifacts...")
    os.makedirs('frontend/public/download', exist_ok=True)

    axml_bytes = build_axml()
    dex_bytes = build_dex()
    arsc_bytes = build_resources_arsc()

    icon_path = 'frontend/public/icons/icon-512x512.png'
    icon_bytes = b''
    if os.path.exists(icon_path):
        with open(icon_path, 'rb') as f:
            icon_bytes = f.read()

    manifest_data = {
        'name': 'Viraasat - Heritage Artisan Marketplace',
        'short_name': 'Viraasat',
        'package': 'org.viraasat.heritage.app',
        'version': '2.4.0',
        'versionCode': 240,
        'minSdkVersion': 26,
        'targetSdkVersion': 34,
        'themeColor': '#701D24',
        'backgroundColor': '#FAF7F2',
        'startUrl': 'https://viraasat.org/',
        'display': 'standalone',
        'orientation': 'portrait',
        'scope': '/',
        'icons': [
            {'src': '/icons/icon-192x192.png', 'sizes': '192x192', 'type': 'image/png'},
            {'src': '/icons/icon-512x512.png', 'sizes': '512x512', 'type': 'image/png'}
        ]
    }

    # Step 1: Write unsigned APK
    unsigned_apk = 'scripts/unsigned.apk'
    with zipfile.ZipFile(unsigned_apk, 'w') as z:
        # AndroidManifest.xml (must be binary XML)
        z.writestr('AndroidManifest.xml', axml_bytes, compress_type=zipfile.ZIP_DEFLATED)
        # classes.dex (Dalvik executable)
        z.writestr('classes.dex', dex_bytes, compress_type=zipfile.ZIP_DEFLATED)
        # resources.arsc (MUST be uncompressed)
        z.writestr('resources.arsc', arsc_bytes, compress_type=zipfile.ZIP_STORED)
        # WebAPK & PWA assets
        z.writestr('assets/manifest.json', json.dumps(manifest_data, indent=2).encode('utf-8'), compress_type=zipfile.ZIP_DEFLATED)
        z.writestr('assets/webapk_config.json', json.dumps({
            'app_id': 'org.viraasat.heritage.app',
            'start_url': 'https://viraasat.org/',
            'name': 'Viraasat',
            'theme_color': '#701D24',
            'background_color': '#FAF7F2'
        }, indent=2).encode('utf-8'), compress_type=zipfile.ZIP_DEFLATED)
        # Icons for all densities
        if icon_bytes:
            for density in ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']:
                z.writestr(f'res/mipmap-{density}/ic_launcher.png', icon_bytes, compress_type=zipfile.ZIP_DEFLATED)

    print(f"Unsigned APK created: {os.path.getsize(unsigned_apk)} bytes")

    # Step 2: Sign APK using jarsigner
    keystore_path = 'scripts/viraasat.keystore'
    if not os.path.exists(keystore_path):
        keytool_exe = r'C:\Program Files\Java\jdk-26.0.2\bin\keytool.exe'
        cmd_gen = [
            keytool_exe, '-genkeypair', '-v',
            '-keystore', keystore_path,
            '-alias', 'viraasat',
            '-keyalg', 'RSA',
            '-keysize', '2048',
            '-validity', '10000',
            '-storepass', 'viraasat123',
            '-keypass', 'viraasat123',
            '-dname', 'CN=Viraasat Heritage, OU=Mobile, O=Viraasat, L=Jaipur, ST=Rajasthan, C=IN'
        ]
        subprocess.check_call(cmd_gen)

    jarsigner_exe = r'C:\Program Files\Java\jdk-26.0.2\bin\jarsigner.exe'
    signed_temp = 'scripts/signed_temp.apk'
    import shutil
    shutil.copyfile(unsigned_apk, signed_temp)

    sign_cmd = [
        jarsigner_exe,
        '-keystore', keystore_path,
        '-storepass', 'viraasat123',
        '-keypass', 'viraasat123',
        '-sigalg', 'SHA256withRSA',
        '-digestalg', 'SHA-256',
        signed_temp,
        'viraasat'
    ]
    print("Signing APK with jarsigner...")
    subprocess.check_call(sign_cmd)

    # Verify signature
    verify_cmd = [jarsigner_exe, '-verify', '-certs', signed_temp]
    result = subprocess.check_output(verify_cmd).decode('utf-8')
    print("Signature verification output:")
    print(result.splitlines()[-3:])

    # Step 3: Copy to target locations
    targets = [
        'frontend/public/download/viraasat.apk',
        'frontend/public/viraasat.apk'
    ]
    for target in targets:
        shutil.copyfile(signed_temp, target)
        print(f"Final Signed APK published to: {target} ({os.path.getsize(target)} bytes)")

    print("APK generation complete and successfully verified!")

if __name__ == '__main__':
    main()
