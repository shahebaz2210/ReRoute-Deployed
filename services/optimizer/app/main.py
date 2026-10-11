import os
import time
from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.models import OptimizationRequest, OptimizationResponse
from app.solver import solve_vrptw

app = FastAPI(
    title="DispatchX VRPTW Optimizer",
    description="Google OR-Tools powered dynamic VRPTW optimization engine with hard constraints and disruption replanning",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WORKER_SECRET = os.environ.get("OPTIMIZER_WORKER_SECRET", "dispatchx-internal-optimizer-secret-2026")

def verify_secret(x_worker_secret: str = Header(None, alias="X-Worker-Secret")):
    if x_worker_secret != WORKER_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid X-Worker-Secret")

@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "optimizer",
        "engine": "Google OR-Tools VRPTW",
        "timestamp": time.time(),
    }

@app.post("/optimize", response_model=OptimizationResponse)
def optimize(request: OptimizationRequest, _auth: None = Depends(verify_secret)):
    # Run Google OR-Tools VRPTW solver
    solution = solve_vrptw(request)
    return solution
