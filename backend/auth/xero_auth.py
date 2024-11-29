import os
from typing import Dict, Optional
import requests
from datetime import datetime, timedelta

class XeroAuthenticationError(Exception):
    """Custom exception for Xero authentication errors"""
    pass

class XeroTokenManager:
    def __init__(self):
        self.client_id = os.getenv('XERO_CLIENT_ID')
        self.client_secret = os.getenv('XERO_CLIENT_SECRET')
        self.redirect_uri = os.getenv('XERO_REDIRECT_URI')
        self.scope = 'offline_access accounting.transactions.read'
        self.token_url = 'https://identity.xero.com/connect/token'
        self.authorize_url = 'https://login.xero.com/identity/connect/authorize'
        
    def get_authorization_url(self) -> str:
        """
        Generate the authorization URL for Xero OAuth2
        """
        try:
            params = {
                'response_type': 'code',
                'client_id': self.client_id,
                'redirect_uri': self.redirect_uri,
                'scope': self.scope,
                'state': self._generate_state()
            }
            
            # Convert params to URL query string
            query_string = '&'.join(f'{k}={v}' for k, v in params.items())
            return f'{self.authorize_url}?{query_string}'
            
        except Exception as e:
            raise XeroAuthenticationError(f'Error generating authorization URL: {str(e)}')

    def exchange_code_for_tokens(self, auth_code: str) -> Dict:
        """
        Exchange authorization code for access and refresh tokens
        """
        try:
            data = {
                'grant_type': 'authorization_code',
                'code': auth_code,
                'redirect_uri': self.redirect_uri,
            }
            
            response = self._make_token_request(data)
            return self._process_token_response(response)
            
        except requests.RequestException as e:
            raise XeroAuthenticationError(f'Error exchanging code for tokens: {str(e)}')
        except Exception as e:
            raise XeroAuthenticationError(f'Unexpected error during token exchange: {str(e)}')

    def refresh_access_token(self, refresh_token: str) -> Dict:
        """
        Refresh the access token using a refresh token
        """
        try:
            data = {
                'grant_type': 'refresh_token',
                'refresh_token': refresh_token,
            }
            
            response = self._make_token_request(data)
            return self._process_token_response(response)
            
        except requests.RequestException as e:
            raise XeroAuthenticationError(f'Error refreshing access token: {str(e)}')
        except Exception as e:
            raise XeroAuthenticationError(f'Unexpected error during token refresh: {str(e)}')

    def _make_token_request(self, data: Dict) -> requests.Response:
        """
        Make a token request to Xero
        """
        headers = {
            'Authorization': f'Basic {self._get_basic_auth_header()}'
        }
        
        response = requests.post(
            self.token_url,
            data=data,
            headers=headers
        )
        
        if response.status_code != 200:
            raise XeroAuthenticationError(
                f'Token request failed with status {response.status_code}: {response.text}'
            )
            
        return response

    def _process_token_response(self, response: requests.Response) -> Dict:
        """
        Process the token response from Xero
        """
        data = response.json()
        
        # Add expiration timestamp for easier management
        data['expires_at'] = datetime.now() + timedelta(seconds=data['expires_in'])
        
        return data

    def _generate_state(self) -> str:
        """
        Generate a random state string for CSRF protection
        """
        import secrets
        return secrets.token_urlsafe(32)

    def _get_basic_auth_header(self) -> str:
        """
        Generate the Basic Auth header for token requests
        """
        import base64
        auth_string = f'{self.client_id}:{self.client_secret}'
        return base64.b64encode(auth_string.encode()).decode()

# Error handling demonstration
def handle_xero_auth_error(error: XeroAuthenticationError) -> Dict:
    """
    Handle Xero authentication errors and return appropriate response
    """
    return {
        'error': True,
        'message': str(error),
        'status_code': 401
    }