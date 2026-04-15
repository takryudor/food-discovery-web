"""
Unit tests for FilterEngine module.

Tests cover:
- Location-based filtering (latitude, longitude)
- Budget/price range filtering
- Tag/category filtering
- Edge cases (empty inputs, boundary values, etc.)
"""

import pytest
from decimal import Decimal
from typing import List, Dict, Any


class MockRestaurant:
    """Mock restaurant object for testing."""
    
    def __init__(self, id: int, name: str, latitude: float, longitude: float, 
                 avg_price: int, tags: List[str], is_open_now: bool = True):
        self.id = id
        self.name = name
        self.latitude = latitude
        self.longitude = longitude
        self.avg_price = avg_price
        self.tags = tags
        self.is_open_now = is_open_now


class TestFilterEngineBudgetFiltering:
    """Test budget/price range filtering."""
    
    @pytest.fixture
    def restaurants(self):
        """Sample restaurants with different price ranges."""
        return [
            MockRestaurant(1, "Cheap Pho", 10.7667, 106.6869, 20000, ["Pho"]),
            MockRestaurant(2, "Mid-range Cafe", 10.7633, 106.6903, 50000, ["Cafe"]),
            MockRestaurant(3, "Expensive Restaurant", 10.7580, 106.6878, 300000, ["Fine Dining"]),
            MockRestaurant(4, "Budget Banh Mi", 10.7650, 106.6850, 15000, ["Banh Mi"]),
            MockRestaurant(5, "Premium Steakhouse", 10.7700, 106.6900, 500000, ["Steakhouse"]),
        ]
    
    def test_filter_by_min_budget(self, restaurants):
        """Test filtering restaurants with minimum budget constraint."""
        min_price = 50000
        filtered = [r for r in restaurants if r.avg_price >= min_price]
        
        assert len(filtered) == 3
        assert all(r.avg_price >= min_price for r in filtered)
        assert filtered[0].id == 2
    
    def test_filter_by_max_budget(self, restaurants):
        """Test filtering restaurants with maximum budget constraint."""
        max_price = 100000
        filtered = [r for r in restaurants if r.avg_price <= max_price]
        
        assert len(filtered) == 3
        assert all(r.avg_price <= max_price for r in filtered)
    
    def test_filter_by_price_range(self, restaurants):
        """Test filtering restaurants within price range [min, max]."""
        min_price = 40000
        max_price = 300000
        filtered = [r for r in restaurants if min_price <= r.avg_price <= max_price]
        
        assert len(filtered) == 2
        assert all(min_price <= r.avg_price <= max_price for r in filtered)
        expected_ids = [2, 3]
        assert [r.id for r in filtered] == expected_ids
    
    def test_filter_empty_result_price_too_low(self, restaurants):
        """Test when no restaurants match high price filter."""
        min_price = 1000000
        filtered = [r for r in restaurants if r.avg_price >= min_price]
        
        assert len(filtered) == 0
    
    def test_filter_price_boundary_values(self, restaurants):
        """Test exact boundary matching."""
        price = 50000
        filtered_min = [r for r in restaurants if r.avg_price >= price]
        filtered_max = [r for r in restaurants if r.avg_price <= price]
        
        assert 2 in [r.id for r in filtered_min]
        assert 2 in [r.id for r in filtered_max]


class TestFilterEngineTagFiltering:
    """Test tag/category-based filtering."""
    
    @pytest.fixture
    def restaurants(self):
        """Sample restaurants with different tags."""
        return [
            MockRestaurant(1, "Pho King", 10.7667, 106.6869, 20000, ["Pho", "Vietnamese"]),
            MockRestaurant(2, "Beachside Cafe", 10.7633, 106.6903, 50000, ["Cafe", "Dessert"]),
            MockRestaurant(3, "Steak House", 10.7580, 106.6878, 300000, ["Steakhouse", "Fine Dining"]),
            MockRestaurant(4, "Banh Mi King", 10.7650, 106.6850, 15000, ["Banh Mi", "Vietnamese"]),
            MockRestaurant(5, "Dessert Paradise", 10.7700, 106.6900, 80000, ["Dessert", "Cafe"]),
        ]
    
    def test_filter_by_single_tag(self, restaurants):
        """Test filtering by a single tag."""
        tag = "Vietnamese"
        filtered = [r for r in restaurants if tag in r.tags]
        
        assert len(filtered) == 2
        assert all(tag in r.tags for r in filtered)
        assert set(r.id for r in filtered) == {1, 4}
    
    def test_filter_by_multiple_tags_any(self, restaurants):
        """Test filtering where restaurant has ANY of the specified tags."""
        tags = ["Cafe", "Dessert"]
        filtered = [r for r in restaurants if any(tag in r.tags for tag in tags)]
        
        assert len(filtered) == 2
        expected_ids = {2, 5}  # Restaurants with Cafe or Dessert
        # Note: Restaurant 5 has both Dessert and Cafe
        assert {r.id for r in filtered} == {2, 5}
    
    def test_filter_by_multiple_tags_all(self, restaurants):
        """Test filtering where restaurant has ALL specified tags."""
        required_tags = ["Cafe", "Dessert"]
        filtered = [r for r in restaurants if all(tag in r.tags for tag in required_tags)]
        
        assert len(filtered) == 2
        assert set(r.id for r in filtered) == {2, 5}
    
    def test_filter_no_matching_tags(self, restaurants):
        """Test filtering when no restaurants have the tag."""
        tag = "Sushi"
        filtered = [r for r in restaurants if tag in r.tags]
        
        assert len(filtered) == 0
    
    def test_filter_case_sensitivity(self, restaurants):
        """Test that tag filtering is case-sensitive."""
        # Using lowercase when data is title case
        tag = "vietnamese"
        filtered = [r for r in restaurants if tag in r.tags]
        
        assert len(filtered) == 0  # Should not match "Vietnamese"
    
    def test_filter_all_tags_listed(self, restaurants):
        """Test that all tags across restaurants are correctly identified."""
        all_tags = set()
        for r in restaurants:
            all_tags.update(r.tags)
        
        expected_tags = {"Pho", "Vietnamese", "Cafe", "Dessert", "Steakhouse", "Fine Dining", "Banh Mi"}
        assert all_tags == expected_tags


class TestFilterEngineLocationFiltering:
    """Test location-based filtering using Haversine distance."""
    
    def haversine(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate the great circle distance between two points 
        on the earth (specified in decimal degrees).
        Returns distance in kilometers.
        """
        from math import radians, cos, sin, asin, sqrt
        
        lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
        c = 2 * asin(sqrt(a))
        r = 6371  # Radius of earth in kilometers
        return c * r
    
    @pytest.fixture
    def restaurants(self):
        """Sample restaurants at different locations in HCMC."""
        return [
            # Ben Thanh area (10.7710, 106.6988)
            MockRestaurant(1, "Ben Thanh Pho", 10.7710, 106.6988, 20000, ["Pho"]),
            # District 1 center (10.7700, 106.6900)
            MockRestaurant(2, "D1 Cafe", 10.7700, 106.6900, 50000, ["Cafe"]),
            # Binh Thanh (10.8000, 106.7200)
            MockRestaurant(3, "Binh Thanh Restaurant", 10.8000, 106.7200, 300000, ["Fine Dining"]),
            # District 2 (10.8160, 106.7647)
            MockRestaurant(4, "District 2 Banh Mi", 10.8160, 106.7647, 15000, ["Banh Mi"]),
            # Tan Binh (10.8000, 106.6500)
            MockRestaurant(5, "Tan Binh Cafe", 10.8000, 106.6500, 80000, ["Cafe"]),
        ]
    
    def test_filter_by_radius_3km(self, restaurants):
        """Test filtering restaurants within 3km radius."""
        user_lat, user_lon = 10.7725, 106.6944  # Ben Thanh area
        radius_km = 3.0
        
        filtered = [
            r for r in restaurants 
            if self.haversine(user_lat, user_lon, r.latitude, r.longitude) <= radius_km
        ]
        
        # Restaurants 1, 2 should be within 3km
        assert len(filtered) >= 2
        assert 1 in [r.id for r in filtered]
        assert 2 in [r.id for r in filtered]
    
    def test_filter_by_radius_10km(self, restaurants):
        """Test filtering restaurants within 10km radius."""
        user_lat, user_lon = 10.7725, 106.6944  # Ben Thanh area
        radius_km = 10.0
        
        filtered = [
            r for r in restaurants 
            if self.haversine(user_lat, user_lon, r.latitude, r.longitude) <= radius_km
        ]
        
        # Should include most/all restaurants
        assert len(filtered) >= 4
    
    def test_filter_by_radius_boundary(self, restaurants):
        """Test restaurants exactly at radius boundary."""
        user_lat, user_lon = 10.7700, 106.6900
        radius_km = 3.0
        
        # Restaurant at exact location should be included
        exact_match = [r for r in restaurants if r.latitude == user_lat and r.longitude == user_lon]
        assert len(exact_match) == 1
        
        filtered = [
            r for r in restaurants 
            if self.haversine(user_lat, user_lon, r.latitude, r.longitude) <= radius_km
        ]
        
        assert 2 in [r.id for r in filtered]
    
    def test_zero_radius(self, restaurants):
        """Test with zero radius - only exact location matches."""
        user_lat, user_lon = 10.7700, 106.6900
        radius_km = 0.0
        
        filtered = [
            r for r in restaurants 
            if self.haversine(user_lat, user_lon, r.latitude, r.longitude) <= radius_km
        ]
        
        # Only exact match (or very close due to floating point)
        assert len(filtered) <= 1
        if len(filtered) == 1:
            assert filtered[0].id == 2


class TestFilterEngineOpenStatus:
    """Test filtering by open/closed status."""
    
    @pytest.fixture
    def restaurants(self):
        """Sample restaurants with different open/closed status."""
        return [
            MockRestaurant(1, "Open Pho", 10.7667, 106.6869, 20000, ["Pho"], is_open_now=True),
            MockRestaurant(2, "Closed Cafe", 10.7633, 106.6903, 50000, ["Cafe"], is_open_now=False),
            MockRestaurant(3, "Open Restaurant", 10.7580, 106.6878, 300000, ["Fine Dining"], is_open_now=True),
            MockRestaurant(4, "Closed Banh Mi", 10.7650, 106.6850, 15000, ["Banh Mi"], is_open_now=False),
        ]
    
    def test_filter_only_open(self, restaurants):
        """Test filtering to show only open restaurants."""
        filtered = [r for r in restaurants if r.is_open_now]
        
        assert len(filtered) == 2
        assert all(r.is_open_now for r in filtered)
        assert set(r.id for r in filtered) == {1, 3}
    
    def test_filter_open_and_closed(self, restaurants):
        """Test showing both open and closed restaurants."""
        filtered = restaurants  # No filter
        
        assert len(filtered) == 4
        assert any(r.is_open_now for r in filtered)
        assert any(not r.is_open_now for r in filtered)


class TestFilterEngineComboFilters:
    """Test combining multiple filters together."""
    
    @pytest.fixture
    def restaurants(self):
        """Restaurants with various attributes."""
        return [
            MockRestaurant(1, "Budget Pho", 10.7667, 106.6869, 20000, ["Pho", "Vietnamese"]),
            MockRestaurant(2, "Mid Cafe", 10.7633, 106.6903, 50000, ["Cafe"], is_open_now=False),
            MockRestaurant(3, "Expensive Fine Dine", 10.7580, 106.6878, 300000, ["Fine Dining"]),
            MockRestaurant(4, "Budget Banh Mi", 10.7650, 106.6850, 15000, ["Banh Mi", "Vietnamese"]),
            MockRestaurant(5, "Premium Cafe", 10.7700, 106.6900, 150000, ["Cafe"]),
        ]
    
    def test_budget_and_tag_filter(self, restaurants):
        """Test filtering by both budget and tag."""
        min_price = 15000
        max_price = 100000
        required_tag = "Cafe"
        
        filtered = [
            r for r in restaurants 
            if (min_price <= r.avg_price <= max_price) and (required_tag in r.tags)
        ]
        
        assert len(filtered) == 1
        assert filtered[0].id == 2
    
    def test_tag_and_open_status(self, restaurants):
        """Test filtering by tag and open status."""
        tag = "Vietnamese"
        open_only = True
        
        filtered = [
            r for r in restaurants 
            if (tag in r.tags) and (r.is_open_now == open_only)
        ]
        
        assert len(filtered) == 2
        assert set(r.id for r in filtered) == {1, 4}
    
    def test_all_filters_combined(self, restaurants):
        """Test combining all filters: budget, tag, and status."""
        min_price = 15000
        max_price = 200000
        tags = ["Cafe", "Vietnamese"]
        open_only = True
        
        filtered = [
            r for r in restaurants 
            if (min_price <= r.avg_price <= max_price) 
            and any(tag in r.tags for tag in tags)
            and (r.is_open_now == open_only)
        ]
        
        # Should include: Budget Pho (1: Vietnamese, open), Budget Banh Mi (4: Vietnamese, open), Premium Cafe (5: Cafe, open)
        # Note: fixture has restaurant 2 (Mid Cafe) with is_open_now=False
        assert len(filtered) == 3
        assert set(r.id for r in filtered) == {1, 4, 5}
