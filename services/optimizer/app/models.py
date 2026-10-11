from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


class PriorityEnum(str, Enum):
    STANDARD = "STANDARD"
    EXPRESS = "EXPRESS"
    CRITICAL = "CRITICAL"


class DepotInput(BaseModel):
    id: str = "DC01"
    depot_id: Optional[str] = None
    latitude: float
    longitude: float
    operating_start_time: str = "08:00"
    operating_end_time: str = "18:00"


class VehicleInput(BaseModel):
    id: str
    vehicle_code: str
    max_weight_kg: float = 1500.0
    max_volume_m3: float = 14.0
    fuel_efficiency: float = 5.4
    fuel_efficiency_unit: str = "km_per_litre"
    vehicle_type: str = "medium_truck"
    available: bool = True
    start_latitude: float
    start_longitude: float
    end_latitude: float
    end_longitude: float
    available_from_minute: int = 480  # 08:00 AM
    available_to_minute: int = 1080   # 06:00 PM
    failure_time_minute: Optional[int] = None  # Mid-day breakdown minute


class OrderInput(BaseModel):
    id: str
    order_reference: str
    retailer_id: Optional[str] = None
    delivery_latitude: float
    delivery_longitude: float
    weight_kg: float
    volume_m3: float
    window_start_minute: int = 480
    window_end_minute: int = 1080
    service_duration_minute: int = 15
    priority: PriorityEnum = PriorityEnum.STANDARD
    previously_assigned_vehicle_id: Optional[str] = None
    status: str = "pending"
    is_completed: bool = False  # Freeze horizon for re-optimization


class RoadClosureInput(BaseModel):
    from_node_index: int
    to_node_index: int
    additional_delay_seconds: int
    active_until_minute: int = 1080


class ObjectiveWeights(BaseModel):
    travel_time_weight: float = 1.0
    distance_weight: float = 0.5
    fuel_weight: float = 0.3
    emissions_weight: float = 0.2
    disruption_penalty_weight: float = 5.0
    unassigned_penalty_critical: int = 100000
    unassigned_penalty_express: int = 50000
    unassigned_penalty_standard: int = 10000


class OptimizationRequest(BaseModel):
    plan_id: str
    is_replan: bool = False
    depot: Optional[DepotInput] = None
    vehicles: List[VehicleInput]
    orders: List[OrderInput]
    duration_matrix_seconds: Optional[List[List[int]]] = None
    distance_matrix_meters: Optional[List[List[int]]] = None
    road_closures: List[RoadClosureInput] = Field(default_factory=list)
    time_limit_seconds: int = 5
    weights: ObjectiveWeights = Field(default_factory=ObjectiveWeights)
    use_osrm: bool = True


class StopAssignment(BaseModel):
    stop_sequence: int
    order_id: Optional[str] = None
    order_reference: Optional[str] = None
    retailer_id: Optional[str] = None
    location_type: str  # DEPOT_START, DELIVERY, DEPOT_END
    latitude: float
    longitude: float
    arrival_minute: int
    waiting_minutes: int = 0
    service_duration_minutes: int = 15
    departure_minute: int
    slack_minutes: int = 0
    cumulative_weight_kg: float = 0.0
    cumulative_volume_m3: float = 0.0
    delivery_status: str = "pending"


class VehicleRoute(BaseModel):
    vehicle_id: str
    vehicle_code: str
    stops: List[StopAssignment]
    total_distance_km: float
    total_duration_minutes: int
    estimated_fuel_liters: float
    estimated_co2_kg: float
    weight_utilization_percent: float
    volume_utilization_percent: float
    is_failed: bool = False
    failure_time_minute: Optional[int] = None
    route_geometry: Optional[Dict[str, Any]] = None


class UnassignedOrder(BaseModel):
    order_id: str
    order_reference: str
    reason_code: str  # CAPACITY_EXCEEDED, TIME_WINDOW_INFEASIBLE, VEHICLE_FAILED
    reason_message: str


class MetricEstimates(BaseModel):
    total_distance_km: float
    total_duration_minutes: int
    total_orders_served: int
    total_orders_unassigned: int
    estimated_fuel_liters: float
    estimated_cost_usd: float
    estimated_co2_kg: float
    is_estimate: bool = True


class ValidationResult(BaseModel):
    is_valid: bool
    errors: List[str] = Field(default_factory=list)


class OptimizationResponse(BaseModel):
    plan_id: str
    status: str  # OPTIMAL, FEASIBLE, INFEASIBLE, TIMED_OUT
    input_hash: str
    solver_duration_ms: int
    routing_provider: str = "OSRM"
    routes: List[VehicleRoute]
    unassigned_orders: List[UnassignedOrder]
    metrics: MetricEstimates
    validation: ValidationResult
    algorithm_explanation: str = (
        "Algorithm: Google OR-Tools VRPTW with Guided Local Search & OSRM Real Road Matrix. "
        "Objective: Multi-objective optimization (distance, travel time, fuel consumption, CO2 emissions, time-window compliance)."
    )
