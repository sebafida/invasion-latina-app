#!/usr/bin/env python3
"""
Backend API Testing for Invasion Latina
Focus on testing the critical /api/events/next endpoint and other core functionality
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend environment
BACKEND_URL = "https://invasionapp.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test credentials
ADMIN_EMAIL = "admin@invasionlatina.be"
ADMIN_PASSWORD = "admin123"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "details": details
        })
    
    def test_health_check(self):
        """Test basic health endpoint"""
        try:
            response = self.session.get(f"{API_BASE}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_result("Health Check", True, "API is healthy and database connected")
                    return True
                else:
                    self.log_result("Health Check", False, f"Unhealthy status: {data}")
                    return False
            else:
                self.log_result("Health Check", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Health Check", False, f"Connection error: {str(e)}")
            return False
    
    def test_authentication(self):
        """Test admin login"""
        try:
            login_data = {
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            }
            
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("access_token") and data.get("email") == ADMIN_EMAIL:
                    self.auth_token = data["access_token"]
                    self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                    self.log_result("Authentication", True, f"Login successful for {ADMIN_EMAIL}")
                    return True
                else:
                    self.log_result("Authentication", False, f"Invalid response structure: {data}")
                    return False
            else:
                self.log_result("Authentication", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Authentication", False, f"Login error: {str(e)}")
            return False
    
    def test_events_next_endpoint(self):
        """Test the critical /api/events/next endpoint - P0 bug fix"""
        try:
            response = self.session.get(f"{API_BASE}/events/next", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if response has the expected structure
                if "event" not in data:
                    self.log_result("Events Next Endpoint", False, "Missing 'event' key in response")
                    return False
                
                event = data["event"]
                required_fields = ["id", "name", "description", "event_date", "venue_name", "venue_address", "lineup", "ticket_categories", "status"]
                
                missing_fields = []
                for field in required_fields:
                    if field not in event:
                        missing_fields.append(field)
                
                if missing_fields:
                    self.log_result("Events Next Endpoint", False, f"Missing required fields: {missing_fields}")
                    return False
                
                # Validate data types and content
                if not isinstance(event["lineup"], list):
                    self.log_result("Events Next Endpoint", False, "lineup should be an array")
                    return False
                
                if not isinstance(event["ticket_categories"], list):
                    self.log_result("Events Next Endpoint", False, "ticket_categories should be an array")
                    return False
                
                # Check if event_date is a valid datetime string
                try:
                    datetime.fromisoformat(event["event_date"].replace('Z', '+00:00'))
                except:
                    self.log_result("Events Next Endpoint", False, f"Invalid event_date format: {event['event_date']}")
                    return False
                
                self.log_result("Events Next Endpoint", True, f"Successfully returned event: {event['name']}")
                print(f"   Event Date: {event['event_date']}")
                print(f"   Venue: {event['venue_name']}")
                print(f"   Lineup Count: {len(event['lineup'])}")
                print(f"   Ticket Categories: {len(event['ticket_categories'])}")
                return True
                
            else:
                self.log_result("Events Next Endpoint", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Events Next Endpoint", False, f"Request error: {str(e)}")
            return False
    
    def test_events_list(self):
        """Test events list endpoint"""
        try:
            response = self.session.get(f"{API_BASE}/events", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list):
                    self.log_result("Events List", True, f"Successfully retrieved {len(data)} events")
                    return True
                else:
                    self.log_result("Events List", False, f"Expected array, got: {type(data)}")
                    return False
            else:
                self.log_result("Events List", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Events List", False, f"Request error: {str(e)}")
            return False
    
    def test_root_endpoint(self):
        """Test API root endpoint"""
        try:
            response = self.session.get(f"{BACKEND_URL}/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("app") == "Invasion Latina API":
                    self.log_result("Root Endpoint", True, f"API root accessible - Version: {data.get('version')}")
                    return True
                else:
                    self.log_result("Root Endpoint", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_result("Root Endpoint", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Root Endpoint", False, f"Request error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("=" * 60)
        print("🚀 INVASION LATINA - BACKEND API TESTING")
        print("=" * 60)
        print(f"Testing Backend: {BACKEND_URL}")
        print(f"API Base: {API_BASE}")
        print()
        
        # Test order based on priority from review request
        tests = [
            ("Root Endpoint", self.test_root_endpoint),
            ("Health Check", self.test_health_check),
            ("Authentication", self.test_authentication),
            ("Events Next (P0 FIX)", self.test_events_next_endpoint),  # Priority test
            ("Events List", self.test_events_list),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n🧪 Running: {test_name}")
            print("-" * 40)
            if test_func():
                passed += 1
        
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print("\n🎉 ALL TESTS PASSED!")
            return True
        else:
            print(f"\n⚠️  {total - passed} TEST(S) FAILED")
            return False

def main():
    """Main test execution"""
    tester = BackendTester()
    success = tester.run_all_tests()
    
    # Return appropriate exit code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()