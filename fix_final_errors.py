# -*- coding: utf-8 -*-
import os, sys, subprocess
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

def run(cmd):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding="utf-8")
    if r.stdout.strip(): print(r.stdout.strip())
    if r.stderr.strip(): print(r.stderr.strip())
    return r.returncode

# Fix WalletPage.tsx — remove second arg from completeTask
path = "src/pages/WalletPage.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "const ok = await completeTask(task, userProfile?.balance ?? 0);",
    "const ok = await completeTask(task);"
)
with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("FIXED WalletPage.tsx")

# Fix StakingPage.tsx — ensure TonConnectButton is in the import
path2 = "src/components/Staking/StakingPage.tsx"
with open(path2, "r", encoding="utf-8") as f:
    content2 = f.read()

# Replace any tonconnect import line to ensure TonConnectButton is included
import re
content2 = re.sub(
    r"import \{[^}]*\} from '@tonconnect/ui-react';",
    "import { useTonConnectUI, useTonAddress, TonConnectButton } from '@tonconnect/ui-react';",
    content2
)
with open(path2, "w", encoding="utf-8") as f:
    f.write(content2)
print("FIXED StakingPage.tsx")

run("git add -A")
run('git commit -m "fix: completeTask arg count + TonConnectButton import"')
code = run("git push origin main")
if code == 0:
    print("Done! Deploying in ~60s.")
else:
    print("Push failed — run: git push origin main")
