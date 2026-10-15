import asyncio
import json
import subprocess
import time
import requests
import websockets
import base64

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA = r"C:\Users\looke\AppData\Local\Temp\cdp_chrome_profile"
URL = "http://localhost:3000/"
OUTPUT_DIR = r"C:\Users\looke\.gemini\antigravity\brain\20e818d1-4498-4c9e-8509-daafc9af8026"

async def capture_cdp():
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--remote-debugging-port=9222",
        f"--user-data-dir={USER_DATA}",
        "--disable-gpu",
        URL
    ])
    
    time.sleep(2.5)
    
    try:
        resp = requests.get("http://127.0.0.1:9222/json", timeout=5)
        targets = resp.json()
        page_target = next((t for t in targets if t.get('type') == 'page'), None)
        if not page_target:
            print("No page target found")
            return
            
        ws_url = page_target['webSocketDebuggerUrl']
        
        async with websockets.connect(ws_url) as ws:
            msg_id = 1
            async def send_cmd(method, params=None):
                nonlocal msg_id
                cid = msg_id
                msg_id += 1
                await ws.send(json.dumps({"id": cid, "method": method, "params": params or {}}))
                while True:
                    raw = await ws.recv()
                    data = json.loads(raw)
                    if data.get('id') == cid:
                        return data.get('result', {})

            # ---------------- DESKTOP (1280 x 850) ----------------
            await send_cmd("Emulation.setDeviceMetricsOverride", {
                "width": 1280,
                "height": 850,
                "deviceScaleFactor": 1,
                "mobile": False
            })
            await asyncio.sleep(1)

            # 1. Mapa de Transiciones (Desktop)
            await send_cmd("Runtime.evaluate", {
                "expression": "document.getElementById('tienda-section').scrollIntoView({behavior: 'instant', block: 'center'});"
            })
            await asyncio.sleep(1)
            res = await send_cmd("Page.captureScreenshot", {"format": "png"})
            if 'data' in res:
                with open(f"{OUTPUT_DIR}\\captura_mapa_desktop.png", "wb") as f:
                    f.write(base64.b64decode(res['data']))
                print("Saved captura_mapa_desktop.png")

            # 2. Switch to Autoestima Verde (Desktop)
            await send_cmd("Runtime.evaluate", {
                "expression": "switchProduct('autoestima');"
            })
            await asyncio.sleep(1)
            res = await send_cmd("Page.captureScreenshot", {"format": "png"})
            if 'data' in res:
                with open(f"{OUTPUT_DIR}\\captura_autoestima_desktop.png", "wb") as f:
                    f.write(base64.b64decode(res['data']))
                print("Saved captura_autoestima_desktop.png")

            # 3. Open Modal for Autoestima Verde (Desktop)
            await send_cmd("Runtime.evaluate", {
                "expression": "openProductModal('autoestima');"
            })
            await asyncio.sleep(1)
            res = await send_cmd("Page.captureScreenshot", {"format": "png"})
            if 'data' in res:
                with open(f"{OUTPUT_DIR}\\captura_modal_autoestima.png", "wb") as f:
                    f.write(base64.b64decode(res['data']))
                print("Saved captura_modal_autoestima.png")

            # Close modal
            await send_cmd("Runtime.evaluate", {
                "expression": "closeProductModal();"
            })
            await asyncio.sleep(0.5)

            # ---------------- MOBILE (390 x 844) ----------------
            await send_cmd("Emulation.setDeviceMetricsOverride", {
                "width": 390,
                "height": 844,
                "deviceScaleFactor": 2,
                "mobile": True
            })
            await asyncio.sleep(1)

            # 4. Autoestima Verde (Mobile)
            await send_cmd("Runtime.evaluate", {
                "expression": "document.getElementById('prod-mockup-img').scrollIntoView({behavior: 'instant', block: 'center'});"
            })
            await asyncio.sleep(1)
            res = await send_cmd("Page.captureScreenshot", {"format": "png"})
            if 'data' in res:
                with open(f"{OUTPUT_DIR}\\captura_autoestima_mobile.png", "wb") as f:
                    f.write(base64.b64decode(res['data']))
                print("Saved captura_autoestima_mobile.png")

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except:
            proc.kill()

if __name__ == '__main__':
    asyncio.run(capture_cdp())
