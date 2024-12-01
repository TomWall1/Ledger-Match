from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import xero
import uvicorn

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ledger-match.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(xero.router, prefix="/xero", tags=["xero"])

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=10000, reload=True)
