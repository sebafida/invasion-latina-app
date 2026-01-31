from typing import Optional, Dict, Any
import logging
import json
from datetime import datetime
from config import settings

logger = logging.getLogger(__name__)

class FirebaseService:
    """
    Firebase Realtime Database Service
    
    ⚠️  MOCK IMPLEMENTATION FOR DEVELOPMENT
    
    TODO: Replace with real Firebase Admin SDK when you add your credentials
    
    To implement Firebase:
    1. Install: pip install firebase-admin
    2. Add your firebase-adminsdk.json credentials file
    3. Initialize:
       import firebase_admin
       from firebase_admin import credentials, db
       
       cred = credentials.Certificate('path/to/serviceAccountKey.json')
       firebase_admin.initialize_app(cred, {
           'databaseURL': settings.firebase_database_url
       })
    4. Replace methods below with actual Firebase calls
    """
    
    def __init__(self):
        self.mock_data: Dict[str, Any] = {
            "events": {},
            "song_requests": {},
            "votes": {}
        }
        logger.warning("⚠️  Using MOCK Firebase service. Replace with real Firebase in production!")
    
    async def create_request(self, event_id: str, request_data: dict) -> str:
        """
        Create a song request in Firebase
        
        Real Firebase:
        ref = db.reference(f'/events/{event_id}/requests')
        new_request = ref.push(request_data)
        return new_request.key
        """
        # MOCK implementation
        request_id = f"mock_req_{datetime.utcnow().timestamp()}"
        
        if event_id not in self.mock_data["song_requests"]:
            self.mock_data["song_requests"][event_id] = {}
        
        self.mock_data["song_requests"][event_id][request_id] = request_data
        logger.info(f"MOCK: Created request {request_id} for event {event_id}")
        
        return request_id
    
    async def get_event_requests(self, event_id: str) -> Dict[str, Any]:
        """
        Get all requests for an event
        
        Real Firebase:
        ref = db.reference(f'/events/{event_id}/requests')
        requests = ref.get()
        return requests or {}
        """
        # MOCK implementation
        return self.mock_data["song_requests"].get(event_id, {})
    
    async def update_request_status(self, event_id: str, request_id: str, status: str, reason: Optional[str] = None):
        """
        Update request status (DJ action)
        
        Real Firebase:
        ref = db.reference(f'/events/{event_id}/requests/{request_id}')
        ref.update({
            'status': status,
            'rejection_reason': reason,
            'updated_at': datetime.utcnow().isoformat()
        })
        """
        # MOCK implementation
        if event_id in self.mock_data["song_requests"]:
            if request_id in self.mock_data["song_requests"][event_id]:
                self.mock_data["song_requests"][event_id][request_id]["status"] = status
                if reason:
                    self.mock_data["song_requests"][event_id][request_id]["rejection_reason"] = reason
                logger.info(f"MOCK: Updated request {request_id} to {status}")
    
    async def add_vote(self, event_id: str, request_id: str, user_id: str) -> int:
        """
        Add a vote to a request
        
        Real Firebase:
        ref = db.reference(f'/events/{event_id}/requests/{request_id}/voters')
        voters = ref.get() or []
        if user_id not in voters:
            voters.append(user_id)
            ref.set(voters)
            votes_ref = db.reference(f'/events/{event_id}/requests/{request_id}/votes')
            votes_ref.set(len(voters))
        return len(voters)
        """
        # MOCK implementation
        if event_id in self.mock_data["song_requests"]:
            if request_id in self.mock_data["song_requests"][event_id]:
                request = self.mock_data["song_requests"][event_id][request_id]
                if "voters" not in request:
                    request["voters"] = []
                
                if user_id not in request["voters"]:
                    request["voters"].append(user_id)
                    request["votes"] = len(request["voters"])
                    logger.info(f"MOCK: Added vote from {user_id} to request {request_id}")
                
                return request["votes"]
        return 0
    
    async def remove_vote(self, event_id: str, request_id: str, user_id: str) -> int:
        """
        Remove a vote from a request
        
        Real Firebase:
        ref = db.reference(f'/events/{event_id}/requests/{request_id}/voters')
        voters = ref.get() or []
        if user_id in voters:
            voters.remove(user_id)
            ref.set(voters)
            votes_ref = db.reference(f'/events/{event_id}/requests/{request_id}/votes')
            votes_ref.set(len(voters))
        return len(voters)
        """
        # MOCK implementation
        if event_id in self.mock_data["song_requests"]:
            if request_id in self.mock_data["song_requests"][event_id]:
                request = self.mock_data["song_requests"][event_id][request_id]
                if "voters" in request and user_id in request["voters"]:
                    request["voters"].remove(user_id)
                    request["votes"] = len(request["voters"])
                    logger.info(f"MOCK: Removed vote from {user_id} to request {request_id}")
                
                return request.get("votes", 0)
        return 0

# Global Firebase service instance
firebase_service = FirebaseService()