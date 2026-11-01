import os

frontend_src = 'frontend/src'
issues = []

for root, _, files in os.walk(frontend_src):
    for f in files:
        if f.endswith(('.tsx', '.ts')):
            fp = os.path.join(root, f)
            with open(fp, 'r', encoding='utf-8', errors='ignore') as file:
                lines = file.readlines()
                for idx, line in enumerate(lines):
                    stripped = line.strip()
                    if stripped in ["'use client';", '"use client";']:
                        if idx > 0:
                            # check if preceding lines are only comments or whitespace
                            preceding = [lines[i].strip() for i in range(idx)]
                            non_comments = [l for l in preceding if l and not l.startswith('//') and not l.startswith('/*') and not l.startswith('*')]
                            if non_comments:
                                issues.append((fp, idx + 1, non_comments))

print("Found issues:", len(issues))
for fp, line_no, non_comments in issues:
    print(f"{fp}:{line_no} -> preceding code: {non_comments[:2]}")

