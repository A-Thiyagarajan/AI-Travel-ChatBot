import os
import webbrowser
from threading import Timer

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request
from flask_cors import CORS

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
GROQ_API_URL = os.getenv("GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions")

app = Flask(__name__)
CORS(app)

SYSTEM_PROMPT = """You are an intelligent AI Travel Planner Assistant.

Your goal is to generate a highly practical, realistic, and structured travel plan suitable for a real-world travel application.

IMPORTANT RULES:

1. Budget Rules (STRICT):
- LOW (Rs.1000-Rs.3000/day): budget stays, public transport, street/local food
- MEDIUM (Rs.3000-Rs.8000/day): 3-star hotels, mix of cab/public transport
- HIGH (Rs.8000+/day): premium hotels, private cab, premium experiences
- ALL prices MUST be in Indian Rupees using Rs.

2. Planning Rules:
- Use only real and well-known places.
- Group nearby places in the same day.
- Avoid long-distance travel within a single day.
- Optimize route to reduce travel fatigue.
- Each day must have 3-5 places maximum.

3. Transport Planning:
For EACH day include:
- Mode of transport: walk / auto / bus / cab / rental bike.
- Travel time between places.
- Cost per travel segment in Rs.

4. Map Integration Requirement:
For EACH place include:
- Place Name.
- Area/Location for map search.
- Format example: Place: Baga Beach, Goa.

5. Budget Calculation:
Provide a clear breakdown in Rs:
- Stay.
- Food.
- Transport.
- Activities / Entry Tickets.
- Total per day.
- Total trip cost.

6. Food Recommendations:
- Include local dishes.
- Mention specific popular restaurants or areas.

7. Stay Suggestions:
Provide 3 categories:
- Budget: Rs. range + type.
- Mid-range.
- Luxury.

STRICT OUTPUT FORMAT:

--- TRAVEL PLAN ---

Destination:
Duration:

Day-wise Itinerary:

Day 1:
- Morning:
  - Place:
  - Activity:
- Afternoon:
  - Place:
  - Activity:
- Evening:
  - Place:
  - Activity:

Transport:
- Mode:
- Route:
- Time:
- Cost:

Day 2:
- Morning:
  - Place:
  - Activity:
- Afternoon:
  - Place:
  - Activity:
- Evening:
  - Place:
  - Activity:

Transport:
- Mode:
- Route:
- Time:
- Cost:

(continue for all days)

--------------------------------------------------

Food Recommendations:
- Local dishes:
- Restaurants / food areas:

--------------------------------------------------

Stay Suggestions:
- Budget:
- Mid-range:
- Luxury:

--------------------------------------------------

Overall Transport Tips:
- Best transport options.
- Estimated daily travel cost.

--------------------------------------------------

Budget Breakdown (in Rs):
- Stay:
- Food:
- Transport:
- Activities:
- Total:

--------------------------------------------------

Travel Tips:
- Safety tips.
- Best time to visit.
- Things to avoid.

FORMATTING RULES:
- Use bullet points.
- Keep spacing clean.
- Avoid long paragraphs.
- Make output UI-friendly.
- Ensure clarity for app display.
- The output should be directly usable in travel apps, map integration, budget tracking UI, and day-wise cards."""


def open_browser():
    """Automatically open the browser when the server starts."""
    webbrowser.open_new("http://127.0.0.1:5000/")


def build_user_prompt(destination: str, duration: str, budget: str, interests: str, style: str) -> str:
    return f"""User Inputs:
- Destination: {destination}
- Duration: {duration} days
- Budget: {budget} (low / medium / high)
- Interests: {interests or "general sightseeing, food, and culture"}
- Travel Style: {style or "balanced"}

Generate the travel plan now."""


def extract_groq_text(payload):
    try:
        return payload["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError(f"Unexpected response from Groq: {payload}") from exc


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/health")
def health():
    return jsonify({"ok": True, "hasApiKey": bool(GROQ_API_KEY), "provider": "groq", "model": GROQ_MODEL})


@app.route("/generate-plan", methods=["POST"])
def generate_plan():
    if not GROQ_API_KEY:
        return jsonify({"error": "GROQ_API_KEY is missing. Add it to the .env file, then restart the server."}), 500

    data = request.get_json(silent=True) or {}

    destination = data.get("destination", "").strip()
    duration = data.get("duration", "").strip()
    budget = data.get("budget", "").strip()
    interests = data.get("interests", "").strip()
    style = data.get("style", "").strip()

    if not all([destination, duration, budget]):
        return jsonify({"error": "Destination, duration, and budget are required."}), 400

    try:
        response = requests.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": build_user_prompt(destination, duration, budget, interests, style)},
                ],
                "temperature": 0.7,
                "max_tokens": 3000,
            },
            timeout=60,
        )
        response.raise_for_status()
        return jsonify({"plan": extract_groq_text(response.json())})
    except requests.RequestException as exc:
        error_text = exc.response.text if exc.response is not None else str(exc)
        return jsonify({"error": f"Groq request failed: {error_text}"}), 500
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    Timer(1.5, open_browser).start()
    print("Starting AI Travel Planner...")
    print(f"Opening http://127.0.0.1:{port}/ in your browser...")
    if not GROQ_API_KEY:
        print("Warning: GROQ_API_KEY is missing. Add it to .env before generating plans.")
    print("Press CTRL+C to stop the server.\n")
    app.run(debug=True, host="0.0.0.0", port=port, use_reloader=False)
