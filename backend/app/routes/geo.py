from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.orm import Session

from app.modules.geo.schemas import (
    MapMarkerRequest,
    GeoJSONFeatureCollection,
    RouteResponse,
)
from app.modules.geo.geo_facade import geo_facade
from app.db.session import get_db

router = APIRouter(prefix="/geo", tags=["Geo & Routing"])


# Router alias cho /map-markers (không prefix /geo)
router_map_markers_alias = APIRouter()


@router.post("/map-markers", response_model=GeoJSONFeatureCollection)
@router_map_markers_alias.post(
    "/map-markers",
    response_model=GeoJSONFeatureCollection,
    include_in_schema=False,
)
async def get_map_markers(
    payload: MapMarkerRequest,
    db: Session = Depends(get_db),
) -> GeoJSONFeatureCollection:
    """
    Trả về GeoJSON markers cho map view dựa trên list ID truyền vào.

    - **payload.restaurant_ids**: Danh sách ID quán ăn cần hiển thị
    """
    return await geo_facade.get_map_markers(
        restaurant_id = payload.restaurant_ids, 
        db = db, 
        user_lat = payload.user_lat,  
        user_lng = payload.user_lng 
    )


@router.get("/get-route/{restaurant_id}", response_model=RouteResponse)
async def get_route(
    restaurant_id: int = Path(..., gt=0, description="ID quán ăn"),
    user_lat: float = Query(
        ..., ge=-90, le=90, description="Vĩ độ hiện tại của người dùng"
    ),
    user_lng: float = Query(
        ..., ge=-180, le=180, description="Kinh độ hiện tại của người dùng"
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
    
    - **restaurant_id**: ID quán ăn (phải > 0)
    - **user_lat**: Vĩ độ hiện tại (-90 đến 90)
    - **user_lng**: Kinh độ hiện tại (-180 đến 180)
    - **mode**: Phương tiện (driving, walking, bicycling, transit)
    """
    return await geo_facade.get_route(
        restaurant_id=restaurant_id,
        user_lat=user_lat,
        user_lng=user_lng,
        mode=mode,
        db=db,
    )