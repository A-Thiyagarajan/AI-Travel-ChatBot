import os
import sys

import requests
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
GROQ_API_URL = os.getenv("GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions")

if not GROQ_API_KEY:
    print("Error: GROQ_API_KEY not found. Please set it in the .env file.")
    sys.exit(1)

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


def get_input(prompt: str, required: bool = True) -> str:
    """Read user input and re-prompt if required but missing."""
    while True:
        try:
            value = input(prompt).strip()
        except (EOFError, KeyboardInterrupt):
            print("\nExiting. Have a great trip!")
            sys.exit(0)
        if value or not required:
            return value
        print("This field is required. Please provide a value.")


def collect_details() -> dict:
    """Gather travel preferences from the user."""
    print("Welcome to AI Travel Planner!\n")
    print("Please answer a few quick questions so I can craft your perfect trip.\n")

    return {
        "destination": get_input("Destination (city/country): "),
        "duration": get_input("Duration (e.g., 3 days, 1 week): "),
        "budget": get_input("Budget level (low / medium / luxury): "),
        "interests": get_input("Interests (e.g., history, food, adventure, beaches, nightlife): ", required=False),
        "style": get_input("Travel style (e.g., relaxed, packed, family, solo, romantic): ", required=False),
    }


def build_user_prompt(details: dict) -> str:
    return f"""User Inputs:
- Destination: {details['destination']}
- Duration: {details['duration']} days
- Budget: {details['budget']} (low / medium / high)
- Interests: {details['interests'] or "general sightseeing, food, and culture"}
- Travel Style: {details['style'] or "balanced"}

Generate the travel plan now."""


def extract_groq_text(payload):
    try:
        return payload["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError(f"Unexpected response from Groq: {payload}") from exc


def generate_plan(details: dict) -> str:
    """Call Groq to generate the travel plan."""
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
                    {"role": "user", "content": build_user_prompt(details)},
                ],
                "temperature": 0.7,
                "max_tokens": 3000,
            },
            timeout=60,
        )
        response.raise_for_status()
        return extract_groq_text(response.json())
    except Exception as exc:
        return f"Something went wrong while generating the plan: {exc}"


def main() -> None:
    details = collect_details()
    print("\nGenerating your personalized travel plan...\n")
    print(generate_plan(details))
    print("\nEnjoy your trip!")


if __name__ == "__main__":
    main()
