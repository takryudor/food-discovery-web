from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.modules.geo.schemas import (
    MapMarkerRequest,
    GeoJSONFeatureCollection,
    RouteResponse,
)
from app.modules.geo.geo_facade import geo_facade
from app.core.database import get_db

router = APIRouter(prefix="/geo", tags=["Geo & Routing"])



@router.post("/map-markers", response_model=GeoJSONFeatureCollection)
async def get_map_markers(
    payload: MapMarkerRequest, db: Session = Depends(get_db)
) -> GeoJSONFeatureCollection:
    """
    Trả về GeoJSON markers cho map view dựa trên list ID truyền vào.
    
    - **payload.restaurant_ids**: Danh sách ID quán ăn cần hiển thị
    """
    return await geo_facade.get_map_markers(payload.restaurant_ids, db)


@router.get("/get-route/{restaurant_id}", response_model=RouteResponse)
async def get_route(
    restaurant_id: int,
    user_lat: float = Query(
        ..., description="Vĩ độ hiện tại của người dùng"
    ),
    user_lng: float = Query(
        ..., description="Kinh độ hiện tại của người dùng"
    ),
    mode: str = Query(
        "driving",
        pattern="^(driving|walking|bicycling|transit)$",
        description="Phương tiện di chuyển",
    ),
    db: Session = Depends(get_db),
) -> RouteResponse:
    """
    Tính toán ETA và khoảng cách từ vị trí người dùng đến quán ăn.
    
    - **restaurant_id**: ID quán ăn
    - **user_lat**: Vĩ độ hiện tại
    - **user_lng**: Kinh độ hiện tại
    - **mode**: Phương tiện (driving, walking, bicycling, transit)
    """
    return await geo_facade.get_route(
        restaurant_id=restaurant_id,
        user_lat=user_lat,
        user_lng=user_lng,
        mode=mode,
        db=db,
    )