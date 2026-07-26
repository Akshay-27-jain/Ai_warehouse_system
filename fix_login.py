import sys

filepath = "d:/project/Ai_warehouse_system/apps/web/src/pages/LoginPage.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Step 1: Add the mb-5 wrapper div opening
old1 = 'sm:px-8">\n\n            '
new1 = 'sm:px-8">\n          <div class="mb-5 flex items-center justify-center">\n            '

if old1 in content:
    content = content.replace(old1, new1)
    # Step 2: Close the mb-5 div after ShieldCheck
    old2 = '</div>\n          <div class="text-center">'
    # Find the right occurrence - it should be the first one after the ShieldCheck
    # We need to close the mb-5 div before the text-center div
    shield_check_pos = content.find('<ShieldCheck')
    after_shield = content.find('</div>', shield_check_pos)
    text_center_start = content.find('<div class="text-center">', after_shield)
    # Get the exact text between
    between = content[after_shield:text_center_start]
    if between == '\n          ':
        old2_exact = '</div>\n          <div class="text-center">'
        new2_exact = '</div>\n          </div>\n          <div class="text-center">'
        content = content.replace(old2_exact, new2_exact, 1)  # only replace first occurrence
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print("SUCCESS: Fixed LoginPage.tsx")
    else:
        print(f"Found text between: {repr(between)}")
else:
    print("FAIL: Could not find the first target string")
    idx = content.find('sm:px-8"')
    if idx >= 0:
        print(repr(content[idx:idx+300]))
</｜｜DSML｜｜parameter>
</｜｜DSML｜｜invoke>
</｜｜DSML｜｜tool_calls>
