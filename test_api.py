import requests
import time
import sys

def test_api():
    url = "http://127.0.0.1:5000/generate"
    payload = {
        "idea": "A coffee shop for coders",
        "style": "Modern",
        "audience": "Developers"
    }
    
    print("Testing /generate endpoint...")
    try:
        response = requests.post(url, json=payload, timeout=5)
        if response.status_code == 200:
            print("SUCCESS: API returned 200")
            print("Response:", response.json())
        else:
            print(f"FAILURE: API returned {response.status_code}")
            print(response.text)
            sys.exit(1)
    except Exception as e:
        print(f"FAILURE: Connection error - {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Give the server a moment to start if run immediately after
    time.sleep(2)
    test_api()
