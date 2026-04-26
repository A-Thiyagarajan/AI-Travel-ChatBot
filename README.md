# AI Travel Planner

AI travel-planning web app with a static frontend and a Flask + Groq backend.

## Important Deployment Note

GitHub Pages can host only the frontend files. It cannot run `app.py`, and you must not put `GROQ_API_KEY` in browser JavaScript.

To deploy publicly:

1. Push this repo to GitHub.
2. Deploy the Flask backend to a Python host such as Render, Railway, or Fly.io.
3. Add `GROQ_API_KEY` as a backend environment variable on that host.
4. Put the deployed backend URL in `static/js/config.js`.
5. Enable GitHub Pages for the repo.

## Local Run

```powershell
python -m pip install -r requirements.txt
copy .env.example .env
```

Edit `.env` and add your real Groq key:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Start the backend:

```powershell
python app.py
```

Open:

```text
http://127.0.0.1:5000
```

Or click VS Code **Go Live** and open `index.html`. Live Server will call `http://127.0.0.1:5000` automatically when running locally.

## GitHub Pages Frontend

Before enabling Pages, edit `static/js/config.js`:

```js
window.TRAVEL_API_BASE = "https://your-deployed-backend.example.com";
```

Then in GitHub:

1. Go to repo **Settings**.
2. Open **Pages**.
3. Source: deploy from branch.
4. Branch: `main`.
5. Folder: `/root`.

Your GitHub Pages URL will load `index.html` and send requests to the backend URL configured above.

## Backend Deploy On Render

This repo includes `render.yaml`, `Procfile`, and `runtime.txt`.

On Render:

1. Create a new Web Service from this GitHub repo.
2. Build command: `pip install -r requirements.txt`
3. Start command: `gunicorn app:app`
4. Add environment variable `GROQ_API_KEY`.
5. Deploy.
6. Copy the Render URL into `static/js/config.js`.

## Project Files

- `index.html` - GitHub Pages / static frontend
- `static/js/config.js` - frontend backend URL configuration
- `static/js/app.js` - frontend form and API logic
- `static/css/style.css` - styling
- `app.py` - Flask backend API
- `templates/index.html` - Flask-rendered frontend for direct backend usage
- `travel_planner.py` - optional CLI version
- `requirements.txt` - Python dependencies
- `.env.example` - safe environment template

## Safety

- `.env` is ignored by Git and must never be pushed.
- API calls go through the backend only.
- The browser never receives `GROQ_API_KEY`.
