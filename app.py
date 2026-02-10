import os
import random
import json
import sqlite3
import datetime
import requests
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# --- Configuration ---
DB_PATH = os.path.join(os.path.dirname(__file__), 'database', 'brandcraft.db')
HF_API_KEY = os.environ.get("HUGGINGFACE_API_KEY")
HF_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"  # You can change this model

# --- Database Setup ---
def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS generations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            idea TEXT,
            style TEXT,
            audience TEXT,
            output_json TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# --- Helper Functions ---

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def generate_fallback(idea, style, audience):
    """Fallback generator if API fails or token is missing."""
    
    # Extract keywords (simple heuristic)
    words = [w for w in idea.split() if len(w) > 3]
    keyword = words[0] if words else "Brand"
    keyword = keyword.capitalize()

    # Style-based prefixes and suffixes
    style_map = {
        "Modern": {"pre": ["Neo", "Tech", "Ultra", "Next", "Flux"], "suf": ["ly", "io", "sys", "lab", "hub"]},
        "Minimal": {"pre": ["Pure", "Bare", "Mono", "True", "One"], "suf": ["", "base", "node", "dot", "box"]},
        "Luxury": {"pre": ["Grand", "Elite", "Prime", "Aura", "Royal"], "suf": ["gold", "lux", "th", "mont", "vogue"]},
        "Bold": {"pre": ["Iron", "Mega", "Hyper", "Power", "Stark"], "suf": ["force", "impact", "max", "strike", "core"]},
        "Playful": {"pre": ["Go", "Fun", "Happy", "Snap", "Jolly"], "suf": ["ify", "joy", "pop", "ster", "roo"]}
    }

    # Get style specifics or default to Modern
    s_data = style_map.get(style, style_map["Modern"])
    
    # Generate Names
    names = []
    names.append(f"{random.choice(s_data['pre'])}{keyword}")
    names.append(f"{keyword}{random.choice(s_data['suf'])}")
    names.append(f"{keyword} {random.choice(['Studio', 'Co', 'Global', 'Works', 'Group'])}")
    names.append(f"The {style} {keyword}")
    names.append(f"{random.choice(s_data['pre'])}{random.choice(s_data['suf'])}")

    # Dynamic Color Palette Generation
    # Dynamic Color Palette Generation
    def get_style_colors(style_name):
        palettes = {
            "Modern": ["#2563eb", "#3b82f6", "#60a5fa", "#1e293b", "#f8fafc"],
            "Minimal": ["#000000", "#171717", "#404040", "#d4d4d4", "#ffffff"],
            "Luxury": ["#000000", "#1c1917", "#78716c", "#d6d3d1", "#fbbf24"],
            "Bold": ["#dc2626", "#ea580c", "#fbbf24", "#0f172a", "#ffffff"],
            "Playful": ["#ec4899", "#8b5cf6", "#f43f5e", "#fb923c", "#fde047"]
        }
        base_colors = palettes.get(style_name, palettes["Modern"])
        random.shuffle(base_colors)
        return base_colors

    # Short, punchy taglines based on style
    tagline_templates = {
        "Modern": [f"The Future of {keyword}.", f"Simply {keyword}.", f"Reimagining {keyword}.", "Innovation First."],
        "Minimal": [f"Just {keyword}.", f"Pure {keyword}.", "Less is More.", f"The Essence of {keyword}."],
        "Luxury": [f"Exquisitely {keyword}.", f"Beyond {keyword}.", "Defined by Elegance.", "Timeless Quality."],
        "Bold": [f"{keyword} Evolved.", f"Unstoppable {keyword}.", "Dare to Lead.", f"Power Your {keyword}."],
        "Playful": [f"Joyfully {keyword}.", f"{keyword} for Everyone.", "Spark Your Day.", f"Make {keyword} Fun."]
    }
    
    selected_taglines = tagline_templates.get(style, tagline_templates["Modern"])
    tagline = random.choice(selected_taglines)

    return {
        "brand_names": names,
        "tagline": tagline,
        "description": f"A {style} approach to {idea}, designed for {audience or 'everyone'}. Innovating the future of your industry.",
        "target_audience": audience if audience else "General Consumers seeking quality.",
        "color_palette": get_style_colors(style),
        "logo_prompt": f"A {style} logo design for {idea}, vector style, clean lines, professional.",
        "instagram_bio": f"🚀 {idea} | ✨ {style} vibes | 🌍 For {audience or 'you'} | 👇 Check us out!"
    }

def call_hf_api(prompt):
    if not HF_API_KEY:
        return None
    
    headers = {"Authorization": f"Bearer {HF_API_KEY}"}
    payload = {
        "inputs": prompt,
        "parameters": {"max_length": 512, "temperature": 0.7}
    }
    
    try:
        response = requests.post(HF_API_URL, headers=headers, json=payload, timeout=10)
        return response.json()
    except Exception as e:
        print(f"API Error: {e}")
        return None

def parse_ai_response(raw_text):
    """Attempts to parse JSON from the AI response."""
    try:
        # cleanup markdown code blocks if present
        cleaned_text = raw_text.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned_text)
    except json.JSONDecodeError:
        return None

# --- Routes ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    idea = data.get('idea', '')
    style = data.get('style', 'Modern')
    audience = data.get('audience', '')

    if not idea:
        return jsonify({"error": "Business idea is required"}), 400

    # Prompt Engineering
    prompt = f"""
    Act as a creative brand strategist. Generate branding assets for the following business:
    Business Idea: {idea}
    Style: {style}
    Target Audience: {audience}

    You MUST output valid JSON only. Do not add any conversational text.
    The JSON object must have exactly these keys:
    - "brand_names": (list of 5 strings)
    - "tagline": (string)
    - "description": (string, max 2 sentences)
    - "target_audience": (string, infer if not provided)
    - "color_palette": (list of 5 hex color codes)
    - "logo_prompt": (string, prompt for an image generator)
    - "instagram_bio": (string, with emojis)
    JSON Output:
    """

    ai_response_json = None
    
    # Try API
    api_result = call_hf_api(prompt)
    
    if api_result and isinstance(api_result, list) and 'generated_text' in api_result[0]:
        generated_text = api_result[0]['generated_text']
        ai_response_json = parse_ai_response(generated_text)

    # Use Fallback if API failed or returned bad JSON
    if not ai_response_json:
        print("Using fallback generation.")
        ai_response_json = generate_fallback(idea, style, audience)

    # Save to DB
    try:
        conn = get_db_connection()
        conn.execute('INSERT INTO generations (idea, style, audience, output_json) VALUES (?, ?, ?, ?)',
                     (idea, style, audience, json.dumps(ai_response_json)))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"DB Error: {e}")

    return jsonify(ai_response_json)

@app.route('/history')
def history():
    conn = get_db_connection()
    generations = conn.execute('SELECT * FROM generations ORDER BY timestamp DESC').fetchall()
    conn.close()
    
    # Parse the output_json string back to dict for the template
    history_data = []
    for gen in generations:
        try:
            parsed_output = json.loads(gen['output_json'])
            history_data.append({
                **gen,
                'parsed_output': parsed_output
            })
        except:
            continue
            
    return render_template('history.html', generations=history_data)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
