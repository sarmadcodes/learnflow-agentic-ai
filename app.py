from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import httpx
import genanki
import random
import os
from pathlib import Path

# FORCE LOAD .env + DEBUG PRINT
from dotenv import load_dotenv
load_dotenv()

# DEBUG: This line will tell us the truth
print("OPENAI_API_KEY LOADED →", os.getenv("OPENAI_API_KEY", "MISSING OR EMPTY!!!"))

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

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY not found! Check your .env file!")

OPENAI_URL = "https://api.openai.com/v1/chat/completions"

async def call_openai(prompt: str) -> str:
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            OPENAI_URL,
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
                "max_tokens": 3000
            }
        )
        if response.status_code != 200:
            print("OpenAI Error:", response.text)  # Extra debug
            raise HTTPException(status_code=500, detail=f"OpenAI failed: {response.status_code}")
        return response.json()["choices"][0]["message"]["content"]

@app.post("/api/generate")
async def generate_study_plan(request: StudyRequest):
    prompt = f"""Create a study plan for: {request.topic} over {request.days} days.

Return EXACTLY in this format:

STUDY_PLAN:
[Create a {request.days}-day breakdown with Pomodoro sessions and spaced repetition principles]

FLASHCARDS:
[Create exactly 15 flashcards in format "Q: question | A: answer" one per line]

PRACTICE:
[Create 5 practice questions with detailed answers]

MOTIVATION:
[One savage/funny motivational quote related to {request.topic}]"""

    result = await call_openai(prompt)

    sections = {"study_plan": "", "flashcards": [], "practice": "", "motivation": ""}

    parts = result.split("FLASHCARDS:")
    sections["study_plan"] = parts[0].replace("STUDY_PLAN:", "").strip()

    if len(parts) > 1:
        flash_practice = parts[1].split("PRACTICE:")
        flashcard_text = flash_practice[0].strip()

        for line in flashcard_text.split("\n"):
            line = line.strip()
            if not line: continue
            if " | A:" in line or "|A:" in line:
                q_a = line.split("|", maxsplit=1)
                if len(q_a) == 2:
                    q = q_a[0].replace("Q:", "").strip()
                    a = q_a[1].replace("A:", "").strip()
                    sections["flashcards"].append({"question": q, "answer": a})

        if len(flash_practice) > 1:
            prac_mot = flash_practice[1].split("MOTIVATION:")
            sections["practice"] = prac_mot[0].strip()
            if len(prac_mot) > 1:
                sections["motivation"] = prac_mot[1].strip()

    return sections

@app.post("/api/download-anki")
async def download_anki(flashcards: list):
    model_id = random.randrange(1 << 30, 1 << 31)
    deck_id = random.randrange(1 << 30, 1 << 31)

    anki_model = genanki.Model(
        model_id,
        'Exambro Model',
        fields=[{'name': 'Question'}, {'name': 'Answer'}],
        templates=[{
            'name': 'Card',
            'qfmt': '<div style="font-size:20px;text-align:center">{{Question}}</div>',
            'afmt': '{{FrontSide}}<hr><div style="font-size:18px;color:#6366f1">{{Answer}}</div>',
        }]
    )

    deck = genanki.Deck(deck_id, 'Exambro Study Deck')

    for card in flashcards:
        note = genanki.Note(model=anki_model, fields=[card['question'], card['answer']])
        deck.add_note(note)

    output_path = Path('exambro_deck.apkg')  # Save in current folder, not /tmp
    genanki.Package(deck).write_to_file(str(output_path))

    return FileResponse(output_path, filename='exambro_deck.apkg', media_type='application/octet-stream')

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)  # Changed to 8001 permanently