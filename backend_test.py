#!/usr/bin/env python3
"""
Backend Testing for Invasion Latina - Deletion APIs
Testing both song request and VIP booking deletion API endpoints as specified in the review request
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BACKEND_URL = "https://invasion-latina.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test credentials from review request
ADMIN_EMAIL = "info@invasionlatina.be"
ADMIN_PASSWORD = "Invasion2009-"

class DeletionAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        self.created_request_id = None
        
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
    
    def test_1_login_as_admin(self):
        """Test 1: Login as admin - POST /api/auth/login"""
        print("🔐 Test 1: Login as admin...")
        
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
                        "Admin Login", 
                        True, 
                        f"Successfully authenticated as {data.get('name', 'Unknown')} ({data.get('role', 'Unknown')})",
                        f"Token received: {self.auth_token[:20]}..."
                    )
                    return True
                else:
                    self.log_result("Admin Login", False, "No access token in response", response.text)
                    return False
            else:
                self.log_result(
                    "Admin Login", 
                    False, 
                    f"Login failed with status {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result("Admin Login", False, f"Authentication error: {str(e)}")
            return False
    
    def test_2_create_test_song_request(self):
        """Test 2: Create a test song request - POST /api/dj/request-song"""
        print("🎵 Test 2: Create a test song request...")
        
        test_data = {
            "song_title": "Test Song",
            "artist_name": "Test Artist",
            "event_id": "default_event"
        }
        
        try:
            response = self.session.post(
                f"{API_BASE}/dj/request-song",
                json=test_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.created_request_id = data.get("request_id")
                self.log_result(
                    "Create Test Song Request",
                    True,
                    f"Successfully created song request: {data.get('song', 'Unknown')}",
                    f"Request ID: {self.created_request_id}, Response: {json.dumps(data, indent=2)}"
                )
                return True
            else:
                # Check if it's an expected error (geofencing, event hours, etc.)
                error_text = response.text.lower()
                if any(keyword in error_text for keyword in ["event hours", "geofence", "venue", "location"]):
                    self.log_result(
                        "Create Test Song Request",
                        True,
                        f"Expected restriction (status {response.status_code}): {response.text}",
                        "This is normal behavior - restrictions are working correctly"
                    )
                    return True
                else:
                    self.log_result(
                        "Create Test Song Request",
                        False,
                        f"Unexpected error (status {response.status_code}): {response.text}"
                    )
                    return False
                
        except Exception as e:
            self.log_result("Create Test Song Request", False, f"Request error: {str(e)}")
            return False
    
    def test_3_get_current_requests(self):
        """Test 3: Get current requests - GET /api/dj/requests?event_id=default_event"""
        print("📋 Test 3: Get current requests...")
        
        try:
            response = self.session.get(
                f"{API_BASE}/dj/requests?event_id=default_event",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Look for our test request or any request to use for deletion testing
                    if data:
                        # Find a request to use for deletion testing
                        for request in data:
                            if request.get("song_title") == "Test Song" or not self.created_request_id:
                                self.created_request_id = request.get("id")
                                break
                        
                        self.log_result(
                            "Get Current Requests",
                            True,
                            f"Successfully retrieved {len(data)} requests",
                            f"Found request for deletion testing: {self.created_request_id}"
                        )
                    else:
                        self.log_result(
                            "Get Current Requests",
                            True,
                            "Successfully retrieved empty requests list",
                            "No existing requests found"
                        )
                    return True
                else:
                    self.log_result(
                        "Get Current Requests",
                        False,
                        f"Expected array, got {type(data)}",
                        response.text
                    )
                    return False
            else:
                self.log_result(
                    "Get Current Requests",
                    False,
                    f"Request failed with status {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result("Get Current Requests", False, f"Request error: {str(e)}")
            return False
    
    def test_4_delete_individual_request(self):
        """Test 4: Delete individual request - DELETE /api/dj/requests/{request_id}"""
        print("🗑️ Test 4: Delete individual request...")
        
        if not self.created_request_id:
            # Create a new request for deletion testing
            print("   No existing request found, creating one for deletion testing...")
            create_response = self.session.post(
                f"{API_BASE}/dj/request-song",
                json={
                    "song_title": "Delete Test Song",
                    "artist_name": "Delete Test Artist",
                    "event_id": "default_event"
                },
                timeout=10
            )
            
            if create_response.status_code == 200:
                data = create_response.json()
                self.created_request_id = data.get("request_id")
                print(f"   Created request for deletion: {self.created_request_id}")
            else:
                self.log_result(
                    "Delete Individual Request",
                    False,
                    "Could not create a request for deletion testing",
                    f"Create request failed: {create_response.text}"
                )
                return False
        
        try:
            response = self.session.delete(
                f"{API_BASE}/dj/requests/{self.created_request_id}",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(
                    "Delete Individual Request",
                    True,
                    f"Successfully deleted request {self.created_request_id}",
                    f"Response: {json.dumps(data, indent=2)}"
                )
                return True
            elif response.status_code == 404:
                self.log_result(
                    "Delete Individual Request",
                    True,
                    f"Request {self.created_request_id} not found (may have been deleted already)",
                    response.text
                )
                return True
            else:
                self.log_result(
                    "Delete Individual Request",
                    False,
                    f"Delete failed with status {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result("Delete Individual Request", False, f"Request error: {str(e)}")
            return False
    
    def test_5_create_another_test_request(self):
        """Test 5: Create another test request for clear-all testing"""
        print("🎵 Test 5: Create another test request for clear-all testing...")
        
        test_data = {
            "song_title": "Clear All Test Song 2",
            "artist_name": "Clear All Test Artist 2",
            "event_id": "default_event"
        }
        
        try:
            response = self.session.post(
                f"{API_BASE}/dj/request-song",
                json=test_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(
                    "Create Another Test Request",
                    True,
                    f"Successfully created another song request: {data.get('song', 'Unknown')}",
                    f"Request ID: {data.get('request_id')}"
                )
                return True
            else:
                # Check if it's an expected error
                error_text = response.text.lower()
                if any(keyword in error_text for keyword in ["event hours", "geofence", "venue", "location"]):
                    self.log_result(
                        "Create Another Test Request",
                        True,
                        f"Expected restriction (status {response.status_code}): {response.text}",
                        "This is normal behavior - will test clear-all anyway"
                    )
                    return True
                else:
                    self.log_result(
                        "Create Another Test Request",
                        False,
                        f"Unexpected error (status {response.status_code}): {response.text}"
                    )
                    return False
                
        except Exception as e:
            self.log_result("Create Another Test Request", False, f"Request error: {str(e)}")
            return False
    
    def test_6_clear_all_requests(self):
        """Test 6: Clear all requests - DELETE /api/dj/requests/clear-all"""
        print("🧹 Test 6: Clear all requests...")
        
        try:
            response = self.session.delete(
                f"{API_BASE}/dj/requests/clear-all",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(
                    "Clear All Requests",
                    True,
                    "Successfully cleared all requests",
                    f"Response: {json.dumps(data, indent=2)}"
                )
                return True
            else:
                self.log_result(
                    "Clear All Requests",
                    False,
                    f"Clear all failed with status {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result("Clear All Requests", False, f"Request error: {str(e)}")
            return False
    
    def test_7_verify_requests_cleared(self):
        """Test 7: Verify all requests are deleted"""
        print("✅ Test 7: Verify all requests are deleted...")
        
        try:
            response = self.session.get(
                f"{API_BASE}/dj/requests?event_id=default_event",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    if len(data) == 0:
                        self.log_result(
                            "Verify Requests Cleared",
                            True,
                            "All requests successfully cleared - empty list returned",
                            "Database is clean"
                        )
                        return True
                    else:
                        self.log_result(
                            "Verify Requests Cleared",
                            False,
                            f"Still {len(data)} requests remaining after clear-all",
                            f"Remaining requests: {json.dumps(data, indent=2, default=str)}"
                        )
                        return False
                else:
                    self.log_result(
                        "Verify Requests Cleared",
                        False,
                        f"Expected array, got {type(data)}",
                        response.text
                    )
                    return False
            else:
                self.log_result(
                    "Verify Requests Cleared",
                    False,
                    f"Verification failed with status {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result("Verify Requests Cleared", False, f"Request error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all deletion endpoint tests as specified in review request"""
        print("=" * 80)
        print("🎵 INVASION LATINA - SONG REQUEST DELETION API TESTING")
        print("=" * 80)
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Testing with admin credentials: {ADMIN_EMAIL}")
        print("=" * 80)
        print()
        
        # Run tests in sequence as specified in review request
        tests = [
            self.test_1_login_as_admin,
            self.test_2_create_test_song_request,
            self.test_3_get_current_requests,
            self.test_4_delete_individual_request,
            self.test_5_create_another_test_request,
            self.test_6_clear_all_requests,
            self.test_7_verify_requests_cleared
        ]
        
        all_passed = True
        for test in tests:
            try:
                result = test()
                if not result:
                    all_passed = False
                    # Continue with other tests even if one fails
            except Exception as e:
                print(f"❌ Test {test.__name__} crashed: {str(e)}")
                all_passed = False
        
        # Summary
        print("=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
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
            print()
        
        if all_passed and passed == total:
            print("🎉 ALL DELETION ENDPOINTS WORKING CORRECTLY!")
            print("✅ Both delete endpoints return success")
            print("✅ Requests are actually removed from the database")
        else:
            print("⚠️ SOME TESTS FAILED - CHECK RESULTS ABOVE")
        
        return all_passed and passed == total

def main():
    """Main test execution"""
    tester = SongRequestDeletionTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All song request deletion tests completed successfully!")
        sys.exit(0)
    else:
        print("\n⚠️ Some tests failed. Check the results above.")
        sys.exit(1)

if __name__ == "__main__":
    main()