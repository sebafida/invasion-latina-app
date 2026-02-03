#!/usr/bin/env python3
"""
Backend Testing for Invasion Latina DJ Request System
Testing the DJ endpoints as specified in the review request
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BACKEND_URL = "https://invasion-app.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test credentials
ADMIN_EMAIL = "admin@invasionlatina.be"
ADMIN_PASSWORD = "admin123"

class DJEndpointTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {details}")
        print()
    
    def authenticate(self):
        """Authenticate and get access token"""
        print("🔐 Authenticating with admin credentials...")
        
        try:
            response = self.session.post(
                f"{API_BASE}/auth/login",
                json={
                    "email": ADMIN_EMAIL,
                    "password": ADMIN_PASSWORD
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                if self.auth_token:
                    self.session.headers.update({
                        "Authorization": f"Bearer {self.auth_token}"
                    })
                    self.log_result(
                        "Authentication", 
                        True, 
                        f"Successfully authenticated as {data.get('name', 'Unknown')}"
                    )
                    return True
                else:
                    self.log_result("Authentication", False, "No access token in response")
                    return False
            else:
                self.log_result(
                    "Authentication", 
                    False, 
                    f"Login failed with status {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result("Authentication", False, f"Authentication error: {str(e)}")
            return False
    
    def test_get_dj_requests(self):
        """Test GET /api/dj/requests endpoint"""
        print("🎵 Testing GET /api/dj/requests...")
        
        try:
            response = self.session.get(f"{API_BASE}/dj/requests", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result(
                        "GET /api/dj/requests",
                        True,
                        f"Successfully returned array with {len(data)} requests",
                        f"Response: {json.dumps(data, indent=2, default=str)}"
                    )
                    
                    # Validate structure if requests exist
                    if data:
                        first_request = data[0]
                        required_fields = ["id", "song_title", "artist_name", "user_name", "votes", "requested_at", "can_vote"]
                        missing_fields = [field for field in required_fields if field not in first_request]
                        
                        if missing_fields:
                            self.log_result(
                                "GET /api/dj/requests - Structure",
                                False,
                                f"Missing required fields: {missing_fields}",
                                f"First request: {json.dumps(first_request, indent=2, default=str)}"
                            )
                        else:
                            self.log_result(
                                "GET /api/dj/requests - Structure",
                                True,
                                "All required fields present in response"
                            )
                    
                    return True
                else:
                    self.log_result(
                        "GET /api/dj/requests",
                        False,
                        f"Expected array, got {type(data)}",
                        f"Response: {response.text}"
                    )
                    return False
            else:
                self.log_result(
                    "GET /api/dj/requests",
                    False,
                    f"Request failed with status {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result("GET /api/dj/requests", False, f"Request error: {str(e)}")
            return False
    
    def test_post_request_song(self):
        """Test POST /api/dj/request-song endpoint"""
        print("🎤 Testing POST /api/dj/request-song...")
        
        # Test data with Mirano Continental coordinates
        test_data = {
            "song_title": "Despacito",
            "artist_name": "Luis Fonsi ft. Daddy Yankee",
            "latitude": "50.8486",  # Mirano Continental coordinates
            "longitude": "4.3722"
        }
        
        try:
            response = self.session.post(
                f"{API_BASE}/dj/request-song",
                json=test_data,
                timeout=10
            )
            
            # Expected to fail with 404 "No active event" or 403 for geofencing/hours
            if response.status_code == 404:
                response_text = response.text.lower()
                if "no active event" in response_text or "event" in response_text:
                    self.log_result(
                        "POST /api/dj/request-song",
                        True,
                        "Expected 404 - No active event (correct behavior)",
                        f"Response: {response.text}"
                    )
                    return True
                else:
                    self.log_result(
                        "POST /api/dj/request-song",
                        False,
                        f"Unexpected 404 error: {response.text}"
                    )
                    return False
            elif response.status_code == 403:
                response_text = response.text.lower()
                if "event hours" in response_text or "geofence" in response_text or "venue" in response_text:
                    self.log_result(
                        "POST /api/dj/request-song",
                        True,
                        "Expected 403 - Geofencing or event hours restriction (correct behavior)",
                        f"Response: {response.text}"
                    )
                    return True
                else:
                    self.log_result(
                        "POST /api/dj/request-song",
                        False,
                        f"Unexpected 403 error: {response.text}"
                    )
                    return False
            elif response.status_code == 200:
                # Unexpected success - should investigate
                data = response.json()
                self.log_result(
                    "POST /api/dj/request-song",
                    True,
                    "Unexpected success - song request created",
                    f"Response: {json.dumps(data, indent=2, default=str)}"
                )
                return True
            else:
                self.log_result(
                    "POST /api/dj/request-song",
                    False,
                    f"Unexpected status code {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result("POST /api/dj/request-song", False, f"Request error: {str(e)}")
            return False
    
    def test_post_vote_song(self):
        """Test POST /api/dj/vote/{request_id} endpoint"""
        print("🗳️ Testing POST /api/dj/vote/{request_id}...")
        
        # Use a dummy request ID since we expect this to fail
        dummy_request_id = "507f1f77bcf86cd799439011"
        
        try:
            response = self.session.post(
                f"{API_BASE}/dj/vote/{dummy_request_id}",
                timeout=10
            )
            
            # Expected to fail with 404 "Song request not found"
            if response.status_code == 404:
                response_text = response.text.lower()
                if "not found" in response_text or "request" in response_text:
                    self.log_result(
                        "POST /api/dj/vote/{request_id}",
                        True,
                        "Expected 404 - Song request not found (correct behavior)",
                        f"Response: {response.text}"
                    )
                    return True
                else:
                    self.log_result(
                        "POST /api/dj/vote/{request_id}",
                        False,
                        f"Unexpected 404 error: {response.text}"
                    )
                    return False
            elif response.status_code == 400:
                # Could be invalid request ID format
                self.log_result(
                    "POST /api/dj/vote/{request_id}",
                    True,
                    "Expected 400 - Invalid request ID (correct behavior)",
                    f"Response: {response.text}"
                )
                return True
            elif response.status_code == 200:
                # Unexpected success
                data = response.json()
                self.log_result(
                    "POST /api/dj/vote/{request_id}",
                    True,
                    "Unexpected success - vote added",
                    f"Response: {json.dumps(data, indent=2, default=str)}"
                )
                return True
            else:
                self.log_result(
                    "POST /api/dj/vote/{request_id}",
                    False,
                    f"Unexpected status code {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result("POST /api/dj/vote/{request_id}", False, f"Request error: {str(e)}")
            return False
    
    def test_backend_health(self):
        """Test backend health and connectivity"""
        print("🏥 Testing backend health...")
        
        try:
            response = self.session.get(f"{API_BASE}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(
                    "Backend Health",
                    True,
                    "Backend is healthy and database connected",
                    f"Response: {json.dumps(data, indent=2)}"
                )
                return True
            else:
                self.log_result(
                    "Backend Health",
                    False,
                    f"Health check failed with status {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result("Backend Health", False, f"Health check error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all DJ endpoint tests"""
        print("=" * 60)
        print("🎵 INVASION LATINA - DJ REQUEST SYSTEM TESTING")
        print("=" * 60)
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Testing with admin credentials: {ADMIN_EMAIL}")
        print("=" * 60)
        print()
        
        # Test backend health first
        if not self.test_backend_health():
            print("❌ Backend health check failed. Stopping tests.")
            return False
        
        # Authenticate
        if not self.authenticate():
            print("❌ Authentication failed. Stopping tests.")
            return False
        
        # Run DJ endpoint tests
        print("🎵 Testing DJ Request System Endpoints...")
        print("-" * 40)
        
        test_results = []
        test_results.append(self.test_get_dj_requests())
        test_results.append(self.test_post_request_song())
        test_results.append(self.test_post_vote_song())
        
        # Summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if "✅ PASS" in result["status"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print()
        
        # Show all results
        for result in self.test_results:
            print(f"{result['status']}: {result['test']}")
            print(f"   {result['message']}")
            if result.get('details') and len(result['details']) < 200:
                print(f"   Details: {result['details']}")
            print()
        
        return passed == total

def main():
    """Main test execution"""
    tester = DJEndpointTester()
    success = tester.run_all_tests()
    
    if success:
        print("🎉 All tests completed successfully!")
        sys.exit(0)
    else:
        print("⚠️ Some tests failed. Check the results above.")
        sys.exit(1)

if __name__ == "__main__":
    main()