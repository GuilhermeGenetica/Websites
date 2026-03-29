╔══════════════════════════════════════════════════════════╗
   SeqNode Agent v1.0.0 - Installation & Security Guide
╚══════════════════════════════════════════════════════════╝

This agent is the local bridge between your machine and the SeqNode-OS 
cloud. It allows secure execution of bioinformatics pipelines.

🛡️  1. WINDOWS INSTALLATION (Microsoft Defender)
------------------------------------------------------------
Since this is a specialized tool, Windows SmartScreen may flag it:
1. Double-click the file 'seqnode-agent-v1.0.0-windows.exe'.
2. If a blue box appears saying "Windows protected your PC":
   ➔ Click on the "More info" link (under the text).
   ➔ A new button "Run anyway" will appear. Click it.
3. The Agent GUI will open. Enter your Server URL and Token.


🍎  2. macOS INSTALLATION (Apple Gatekeeper - Universal Support)
------------------------------------------------------------
Compatible with both Intel and Apple Silicon (M1/M2/M3) Macs.
1. Open the .dmg file and find the 'SeqNodeAgent' icon.
2. IMPORTANT: Do NOT just double-click it.
3. Right-Click (or Control-Click) the icon and select "Open".
4. A dialog will ask if you are sure. Click "Open" again.
5. This bypasses the security check for this app permanently.


🐧  3. LINUX INSTALLATION (Terminal)
------------------------------------------------------------
You need to grant execution permissions to the binary:
1. Open your terminal in the folder where the file is located.
2. Make it executable by running:
   $ chmod +x seqnode-agent-v1.0.0-linux-x86_64
3. Launch the agent:
   $ ./seqnode-agent-v1.0.0-linux-x86_64


⚙️  CONFIGURATION
------------------------------------------------------------
- Server URL: Your SeqNode API endpoint (wss://...).
- Agent Token: Found in your SeqNode Web Dashboard under 'Settings > Agent'.
- Workspace: The folder where pipeline results will be stored.

✉️  Support: seqnode@gmail.com
============================================================
