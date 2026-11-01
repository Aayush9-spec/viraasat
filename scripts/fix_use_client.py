import os

path = 'frontend/src/features/analytics/components/artisan-analytics-dashboard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if line.strip() in ["'use client';", '"use client";']:
        continue
    new_lines.append(line)

new_lines.insert(0, "'use client';\n")

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Successfully fixed 'use client' at top of", path)

