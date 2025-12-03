# app.py - Gemini 2.0 Flash: Because 1.5 was so 2024

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StudyRequest(BaseModel):
    topic: str
    days: int

# === GEMINI 2.0 FLASH (stable as of Dec 2025) ===
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY missing from .env — fix that or cry quietly.")

# Updated model name + endpoint (v1beta is back in fashion, apparently)
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

async def call_gemini(prompt: str) -> str:
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            f"{GEMINI_URL}?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.9,
                    "maxOutputTokens": 4096,
                },
                "safetySettings": [  # Chill mode: let the savage quotes flow
                    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
                ]
            }
        )
        if resp.status_code != 200:
            print(f"Gemini threw hands: {resp.status_code} - {resp.text}")
            raise HTTPException(status_code=500, detail="Gemini had a bad day. Try again?")
        
        try:
            # Parse the new(ish) response structure
            data = resp.json()
            if "candidates" not in data or not data["candidates"]:
                raise ValueError("No candidates in response — Gemini's slacking")
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return text.strip()  # Clean that whitespace, it's 2025
        except (KeyError, IndexError, ValueError) as e:
            print(f"Parse fail (blame Google): {e} | Raw: {resp.text[:500]}...")
            raise HTTPException(status_code=500, detail="Gemini spoke in tongues. Raw output below for debug:")

@app.post("/api/generate")
async def generate_study_plan(request: StudyRequest):
    prompt = f"""Yo Gemini, craft a killer study plan for "{request.topic}" across {request.days} days.

Stick to THIS EXACT format like your digital life depends on it (no fluff, no markdown, just the goods):

STUDY_PLAN:
[A {request.days}-day roadmap packed with Pomodoro timers (25/5 vibes), spaced repetition hooks, daily goals, and pro tips. Make it actionable AF.]

FLASHCARDS:
[Drop exactly 15 flashcards, one per line: Q: [question] | A: [answer]. Keep 'em bite-sized but brain-tickling.]

PRACTICE:
[5 spicy practice questions with full, detailed answers. Make 'em test real understanding.]

MOTIVATION:
[One brutally honest, funny-as-hell quote about mastering {request.topic} or the grind of studying. Dark humor encouraged.]"""

    raw_response = await call_gemini(prompt)

    # Parse city — Gemini's usually good at this, but we got backups
    result = {"study_plan": raw_response, "flashcards": [], "practice": "", "motivation": ""}  # Fallback to raw

    try:
        # Split 'n dice
        if "FLASHCARDS:" in raw_response:
            parts = raw_response.split("FLASHCARDS:")
            result["study_plan"] = parts[0].replace("STUDY_PLAN:", "").strip()

            if len(parts) > 1:
                practice_split = parts[1].split("PRACTICE:")
                flashcards_raw = practice_split[0].strip()

                # Flashcard surgery
                for line in flashcards_raw.split("\n"):
                    line = line.strip()
                    if not line or "| A:" not in line:
                        continue
                    q_part, a_part = line.split("| A:", 1)
                    q = q_part.replace("Q:", "").strip()
                    a = a_part.strip()
                    if q and a:  # Sanity check
                        result["flashcards"].append({"question": q, "answer": a})

                # Practice & Motivation
                if len(practice_split) > 1:
                    mot_split = practice_split[1].split("MOTIVATION:")
                    result["practice"] = mot_split[0].strip()
                    if len(mot_split) > 1:
                        result["motivation"] = mot_split[1].strip()

        # If parsing bombed, at least the study plan shows (user sees something)
        if not result["flashcards"]:
            print("⚠️ Flashcard parse flopped — serving raw study plan only. Blame the prompt gods.")

    except Exception as parse_error:
        print(f"Parse apocalypse: {parse_error}")
        # Keep study_plan as raw — better than nada

    return result

if __name__ == "__main__":
    import uvicorn
    print("🚀 LearnFlow server firing up on Gemini 2.0 Flash — hold my energy drink.")
    uvicorn.run(app, host="0.0.0.0", port=8001)
