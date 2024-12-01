from xero import Xero
from xero.auth import OAuth2Credentials
from datetime import datetime, timedelta
import os

class XeroService:
    def __init__(self):
        self.client_id = os.getenv('XERO_CLIENT_ID')
        self.client_secret = os.getenv('XERO_CLIENT_SECRET')
        self.redirect_uri = os.getenv('XERO_REDIRECT_URI')

    def get_authorization_url(self):
        credentials = OAuth2Credentials(
            client_id=self.client_id,
            client_secret=self.client_secret,
            callback_uri=self.redirect_uri,
            scope=['accounting.transactions.read', 'accounting.contacts.read']
        )
        return credentials.generate_url()

    async def handle_callback(self, auth_code):
        credentials = OAuth2Credentials(
            client_id=self.client_id,
            client_secret=self.client_secret,
            callback_uri=self.redirect_uri
        )
        credentials.verify(auth_code)
        return credentials.token

    async def get_customer_invoices(self, token, customer_id):
        credentials = OAuth2Credentials(
            client_id=self.client_id,
            client_secret=self.client_secret,
            callback_uri=self.redirect_uri,
            token=token
        )
        xero = Xero(credentials)
        
        invoices = xero.invoices.filter(
            ContactID=customer_id,
            Status='AUTHORISED'
        )
        
        return [
            {
                'date': invoice.Date,
                'due_date': invoice.DueDate,
                'invoice_number': invoice.InvoiceNumber,
                'reference': invoice.Reference,
                'amount': float(invoice.Total),
                'status': invoice.Status
            }
            for invoice in invoices
        ]
