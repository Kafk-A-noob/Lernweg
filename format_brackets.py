import os
import re

target_dir = r'C:\Users\25R1116\Documents\Lernweg\pages'
count = 0

for root, dirs, files in os.walk(target_dir):
    for file in files:
        if file.endswith('.md') or file.endswith('.mdx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Use direct characters
            new_content = re.sub(r'([^\s])（', r'\1 (', content)
            new_content = new_content.replace('（', '(')
            
            new_content = re.sub(r'）([^\s\.\,、。\n])', r') \1', new_content)
            new_content = new_content.replace('）', ')')
            
            if content != new_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                count += 1
                print(f'Updated: {filepath}')

print(f'\nTotal files updated: {count}')