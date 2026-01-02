import os
import json
import random
import time
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pypdf import PdfReader
from io import BytesIO
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="PlanPass AI - Real Engine")

# --- CORS CONFIGURATION (Crucial for Demo) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for demo purposes to avoid blocking
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ENGINE LOGIC ---

def extract_text_from_pdf(file_content: bytes) -> str:
    """Simulates OCR extraction"""
    try:
        reader = PdfReader(BytesIO(file_content))
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""

def local_heuristic_scan(text: str):
    """
    Deterministically finds issues for the demo.
    In a real scenario, this would use vectors or regex on the text.
    For the investor demo, we return the 'Gold Standard' response 
    to match the Blueprint visualization.
    """
    issues = []
    
    # Issue 1: Occupant Load (High Priority)
    issues.append({
        "type": "high", 
        "code": "IBC 1004.5", 
        "title": "Occupant Load Exceeded", 
        "desc": "Room 104 egress width (32\") insufficient for calculated load (55 occupants). Req: 0.2 inches per occupant.", 
        "recommendation": "Increase door width to 36\" or add secondary egress.",
        "citation_url": "https://up.codes/viewer/ibc-2021/chapter/10/means-of-egress#1004.5"
    })

    # Issue 2: Door Clearance (Medium Priority)
    issues.append({
        "type": "medium", 
        "code": "ADA 404.2.3", 
        "title": "Door Maneuvering Clearance", 
        "desc": "Latch side clearance is 12\" (Req: 18\" for pull side approach).", 
        "recommendation": "Shift door frame or reconfigure approach wall.",
        "citation_url": "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#404-2-3"
    })

    # Issue 3: Handrail (Medium Priority)
    issues.append({
        "type": "medium", 
        "code": "CBC 11B-505", 
        "title": "Stair Handrail Extension", 
        "desc": "Top extension appears less than 12\" horizontally above landing.", 
        "recommendation": "Extend handrail return to meet code.",
        "citation_url": "https://up.codes/viewer/california/ca-building-code-2022/chapter/11B/accessibility-to-public-buildings#11B-505.10.2"
    })

    return issues

# --- API ROUTES ---

@app.post("/api/v1/scan")
async def scan_document(file: UploadFile = File(...)):
    # 1. Simulate Processing Time (so the frontend progress bar feels real)
    time.sleep(2.0) 
    
    print(f"Processing Upload: {file.filename}")
    
    # 2. Extract (Mock or Real)
    content = await file.read()
    text = extract_text_from_pdf(content)
    
    # 3. Analyze
    # We prioritize the heuristic scan for the demo to ensure 
    # the results match the visual blueprint on the frontend.
    detected_issues = local_heuristic_scan(text)
    
    # 4. Score Logic
    critical_count = sum(1 for i in detected_issues if i['type'] == 'high')
    base_score = 98
    final_score = base_score - (critical_count * 10) - (len(detected_issues) * 2)
    
    status = "Passing"
    if final_score < 90: status = "Conditional Pass"
    if final_score < 70: status = "Failed"

    return JSONResponse(content={
        "score": final_score,
        "status": status,
        "issues": detected_issues,
        "filename": file.filename
    })

# --- STATIC FILE SERVING (CRITICAL FOR DEMO) ---

# Explicit routes for key files to prevent 404s
@app.get("/")
async def read_index():
    return FileResponse('index.html')

@app.get("/dashboard")
async def read_dashboard_page():
    return FileResponse('dashboard.html')

@app.get("/dashboard.html")
async def read_dashboard_html():
    return FileResponse('dashboard.html')

@app.get("/demo.html")
async def read_demo_html():
    return FileResponse('demo.html')

@app.get("/style.css")
async def read_css():
    return FileResponse('style.css')

@app.get("/dashboard.css")
async def read_dash_css():
    return FileResponse('dashboard.css')

@app.get("/script.js")
async def read_js():
    return FileResponse('script.js')

@app.get("/js/script.js")
async def read_js_folder():
    return FileResponse('script.js')

@app.get("/js/dashboard.js")
async def read_dash_js():
    return FileResponse('dashboard.js')

# Serve everything else as static (images, etc)
app.mount("/", StaticFiles(directory=".", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)