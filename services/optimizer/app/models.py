from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from enum import Enum


class PriorityEnum(str, Enum):
    STANDARD = "STANDARD"
    EXPRESS = "EXPRESS"
    CRITICAL = "CRITICAL"


class VehicleInput(BaseModel):
    id: str
    vehicle_code: str
    max_weight_kg: float
    max_volume_m3: float
    start_latitude: float
    start_longitude: float
    end_latitude: float
    end_longitude: float
    available_from_minute: int = 0
    available_to_minute: int = 600  # 10 hours default


class OrderInput(BaseModel):
    id: str
    order_reference: str
    delivery_latitude: float
    delivery_longitude: float
    weight_kg: float
    volume_m3: float
    window_start_minute: int
    window_end_minute: int
    service_duration_minute: int = 10
    priority: PriorityEnum = PriorityEnum.STANDARD
    previously_assigned_vehicle_id: Optional[str] = None
    is_completed: bool = False


class ObjectiveWeights(BaseModel):
    travel_time_weight: float = 1.0
    distance_weight: float = 0.5
    disruption_penalty_weight: float = 5.0
    unassigned_penalty_critical: int = 100000
    unassigned_penalty_express: int = 50000
    unassigned_penalty_standard: int = 10000


class OptimizationRequest(BaseModel):
    plan_id: str
    is_replan: bool = False
    vehicles: List[VehicleInput]
    orders: List[OrderInput]
    duration_matrix_seconds: List[List[int]]  # NxN matrix
    distance_matrix_meters: List[List[int]]  # NxN matrix
    time_limit_seconds: int = 5
    weights: ObjectiveWeights = Field(default_factory=ObjectiveWeights)


class StopAssignment(BaseModel):
    stop_sequence: int
    order_id: Optional[str] = None
    order_reference: Optional[str] = None
    location_type: str  # DEPOT_START, DELIVERY, DEPOT_END
    arrival_minute: int
    departure_minute: int
    slack_minutes: int
    cumulative_weight_kg: float
    cumulative_volume_m3: float


class VehicleRoute(BaseModel):
    vehicle_id: str
    vehicle_code: str
    stops: List[StopAssignment]
    total_distance_km: float
    total_duration_minutes: int
    weight_utilization_percent: float
    volume_utilization_percent: float


class UnassignedOrder(BaseModel):
    order_id: str
    order_reference: str
    reason_code: str  # CAPACITY_EXCEEDED, TIME_WINDOW_INFEASIBLE, UNREACHABLE
    reason_message: str


class MetricEstimates(BaseModel):
    total_distance_km: float
    total_duration_minutes: int
    total_orders_served: int
    total_orders_unassigned: int
    estimated_fuel_liters: float
    estimated_cost_usd: float
    estimated_co2_kg: float
    is_estimate: bool = True  # Mandatory FR-020


class OptimizationResponse(BaseModel):
    plan_id: str
    status: str  # OPTIMAL, FEASIBLE, INFEASIBLE, TIMED_OUT
    input_hash: str
    solver_duration_ms: int
    routes: List[VehicleRoute]
    unassigned_orders: List[UnassignedOrder]
    metrics: MetricEstimates
