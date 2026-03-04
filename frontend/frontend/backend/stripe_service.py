from typing import Optional
import logging
from config import settings

logger = logging.getLogger(__name__)

class StripeService:
    """
    Stripe Payment Service
    
    ⚠️  MOCK IMPLEMENTATION FOR DEVELOPMENT
    
    TODO: Replace with real Stripe integration when you add your API keys
    
    To implement Stripe:
    1. Install: pip install stripe
    2. Add your Stripe keys to .env file
    3. Initialize:
       import stripe
       stripe.api_key = settings.stripe_secret_key
    4. Replace methods below with actual Stripe API calls
    
    Documentation: https://stripe.com/docs/api
    """
    
    def __init__(self):
        logger.warning("⚠️  Using MOCK Stripe service. Replace with real Stripe in production!")
        self.mock_payment_intents = {}
    
    async def create_payment_intent(self, amount: int, currency: str = "eur", metadata: dict = None) -> dict:
        """
        Create a payment intent
        
        Real Stripe:
        import stripe
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency=currency,
            payment_method_types=['card', 'bancontact'],
            metadata=metadata
        )
        return {
            'id': intent.id,
            'client_secret': intent.client_secret,
            'amount': intent.amount,
            'status': intent.status
        }
        """
        # MOCK implementation
        from datetime import datetime
        import uuid
        
        payment_intent_id = f"pi_mock_{uuid.uuid4().hex[:16]}"
        client_secret = f"{payment_intent_id}_secret_{uuid.uuid4().hex[:16]}"
        
        payment_intent = {
            "id": payment_intent_id,
            "client_secret": client_secret,
            "amount": amount,
            "currency": currency,
            "status": "requires_payment_method",
            "metadata": metadata or {},
            "created": datetime.utcnow().isoformat()
        }
        
        self.mock_payment_intents[payment_intent_id] = payment_intent
        
        logger.info(f"MOCK: Created payment intent {payment_intent_id} for {amount/100:.2f} {currency}")
        
        return payment_intent
    
    async def confirm_payment(self, payment_intent_id: str) -> dict:
        """
        Confirm a payment intent (simulate successful payment)
        
        Real Stripe:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        return {
            'id': intent.id,
            'status': intent.status,
            'amount': intent.amount
        }
        """
        # MOCK implementation
        if payment_intent_id in self.mock_payment_intents:
            self.mock_payment_intents[payment_intent_id]["status"] = "succeeded"
            logger.info(f"MOCK: Payment {payment_intent_id} succeeded")
            return self.mock_payment_intents[payment_intent_id]
        
        return {"id": payment_intent_id, "status": "succeeded", "amount": 0}
    
    async def create_refund(self, payment_intent_id: str, amount: Optional[int] = None) -> dict:
        """
        Create a refund
        
        Real Stripe:
        refund = stripe.Refund.create(
            payment_intent=payment_intent_id,
            amount=amount
        )
        return {
            'id': refund.id,
            'status': refund.status,
            'amount': refund.amount
        }
        """
        # MOCK implementation
        import uuid
        refund_id = f"re_mock_{uuid.uuid4().hex[:16]}"
        
        logger.info(f"MOCK: Created refund {refund_id} for payment {payment_intent_id}")
        
        return {
            "id": refund_id,
            "status": "succeeded",
            "amount": amount,
            "payment_intent": payment_intent_id
        }

# Global Stripe service instance
stripe_service = StripeService()