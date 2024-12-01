from fastapi import APIRouter, Depends, HTTPException
from ..services.xero_service import XeroService
from ..models.xero import XeroAuthResponse

router = APIRouter()
xero_service = XeroService()

@router.get('/auth/url')
async def get_auth_url():
    url = xero_service.get_authorization_url()
    return {'authorization_url': url}

@router.post('/auth/callback')
async def handle_callback(code: str):
    try:
        token = await xero_service.handle_callback(code)
        return XeroAuthResponse(access_token=token)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get('/customer/{customer_id}/invoices')
async def get_customer_invoices(customer_id: str, token: str):
    try:
        invoices = await xero_service.get_customer_invoices(token, customer_id)
        return {'invoices': invoices}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
