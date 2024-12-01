from pydantic import BaseModel
from typing import Optional

class XeroAuthResponse(BaseModel):
    access_token: str

class XeroInvoice(BaseModel):
    date: str
    due_date: str
    invoice_number: str
    reference: Optional[str]
    amount: float
    status: str
