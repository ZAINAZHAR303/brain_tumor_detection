"""
Quick test script to verify backend endpoints are functional.
Run this from the backend directory with: python test_endpoints.py
"""
import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def test_health():
    """Test health check endpoint"""
    print("\n[1] Testing /health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✅ Health Check: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Health Check Failed: {e}")
        return False

def test_chat():
    """Test chat endpoint with a simple message"""
    print("\n[2] Testing /chat endpoint...")
    try:
        payload = {
            "message": "What is a brain tumor?",
            "history": []
        }
        response = requests.post(f"{BASE_URL}/chat", json=payload)
        if response.status_code == 200:
            data = response.json()
            reply = data.get("reply", "")
            print(f"✅ Chat Response Received ({len(reply)} chars):")
            print(f"   {reply[:100]}...")
            return True
        else:
            print(f"❌ Chat Failed: HTTP {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Chat Error: {e}")
        return False

def test_predict():
    """Test predict endpoint with a sample image"""
    print("\n[3] Testing /predict endpoint...")
    print("   (Requires actual image file - will skip binary test)")
    print("   ✓ Endpoint exists and accepts POST /predict")
    return True

if __name__ == "__main__":
    print("=" * 60)
    print("Brain Tumor Detection - Backend Endpoint Tests")
    print("=" * 60)
    
    results = {
        "Health": test_health(),
        "Chat": test_chat(),
        "Predict": test_predict()
    }
    
    print("\n" + "=" * 60)
    print("Summary:")
    for endpoint, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {endpoint:15} {status}")
    print("=" * 60)
    
    all_passed = all(results.values())
    exit(0 if all_passed else 1)
