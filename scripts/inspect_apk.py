import zipfile
import struct

with zipfile.ZipFile('frontend/public/viraasat.apk', 'r') as z:
    print('Entries in APK:')
    for info in z.infolist():
        print(f'  {info.filename} ({info.file_size} bytes, method: {info.compress_type})')
    data = z.read('AndroidManifest.xml')

def parse_string_pool(data, offset):
    chunk_type, header_size, size, count, style_count, flags, strings_start, styles_start = struct.unpack('<HHIIIIII', data[offset:offset+28])
    offsets = [struct.unpack('<I', data[offset+28+i*4:offset+28+i*4+4])[0] for i in range(count)]
    strings = []
    base = offset + strings_start
    for off in offsets:
        pos = base + off
        b1 = data[pos]; pos += 1
        if b1 & 0x80: pos += 1
        b2 = data[pos]; pos += 1
        blen = b2
        if b2 & 0x80:
            blen = ((b2 & 0x7f) << 8) | data[pos]
            pos += 1
        strings.append(data[pos:pos+blen].decode('utf-8'))
    return strings, offset + size

strings, offset = parse_string_pool(data, 8)
res_type, res_hsize, res_size = struct.unpack('<HHI', data[offset:offset+8])
num_res = (res_size - 8) // 4
res_ids = [struct.unpack('<I', data[offset+8+i*4:offset+8+i*4+4])[0] for i in range(num_res)]
offset += res_size

print('\nManifest Tree:')
indent = 0
while offset < len(data):
    ctype, chsize, csize = struct.unpack('<HHI', data[offset:offset+8])
    if ctype == 0x0102:
        line, comment, ns, name, attr_start, attr_size, attr_count, id_idx, class_idx, style_idx = struct.unpack('<IIIIHHHHHH', data[offset+8:offset+36])
        tag = strings[name]
        attrs_str = []
        cur_attr = offset + 16 + attr_start
        for a in range(attr_count):
            ans, aname, araw, asize, ares0, atype, adata = struct.unpack('<IIIHBBI', data[cur_attr:cur_attr+20])
            aname_str = strings[aname]
            ans_str = f"{strings[ans]}:" if ans != 0xFFFFFFFF else ""
            araw_str = strings[araw] if araw != 0xFFFFFFFF else str(adata)
            res_id = res_ids[aname] if aname < len(res_ids) else 0
            attrs_str.append(f'{ans_str}{aname_str}="{araw_str}" (type={atype}, id=0x{res_id:08x})')
            cur_attr += attr_size
        print('  ' * indent + f'<{tag} ' + ' '.join(attrs_str) + '>')
        indent += 1
    elif ctype == 0x0103:
        indent -= 1
        line, comment, ns, name = struct.unpack('<IIII', data[offset+8:offset+24])
        print('  ' * indent + f'</{strings[name]}>')
    offset += csize
