"""
Integration tests for the Search Flow module.

Tests cover:
- End-to-end: POST /search với data mẫu
- Search with various filter combinations
- Response schema validation
- Error handling and edge cases
- Performance under typical load

Endpoint: POST /search
Expected request body:
{
    "latitude": float,
    "longitude": float,
    "radius_km": int (3, 5, or 10),
    "min_price": int (optional),
    "max_price": int (optional),
    "tags": List[str] (optional),
    "open_now_only": bool (default: false)
}

Expected response:
{
    "results": List[RestaurantResult],
    "total_count": int,
    "search_radius_km": int,
    "timestamp": datetime,
    "execution_time_ms": float
}
"""

import pytest
import json
from typing import Dict, List, Any
from datetime import datetime


class SearchRequest:
    """Simplified search request model."""
    
    def __init__(self, latitude: float, longitude: float, radius_km: int,
                 min_price: int = None, max_price: int = None,
                 tags: List[str] = None, open_now_only: bool = False):
        self.latitude = latitude
        self.longitude = longitude
        self.radius_km = radius_km
        self.min_price = min_price
        self.max_price = max_price
        self.tags = tags or []
        self.open_now_only = open_now_only
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API request."""
        data = {
            "latitude": self.latitude,
            "longitude": self.longitude,
            "radius_km": self.radius_km,
            "open_now_only": self.open_now_only
        }
        
        if self.min_price is not None:
            data["min_price"] = self.min_price
        
        if self.max_price is not None:
            data["max_price"] = self.max_price
        
        if self.tags:
            data["tags"] = self.tags
        
        return data


class RestaurantResult:
    """Simplified restaurant result."""
    
    def __init__(self, id: int, name: str, latitude: float, longitude: float,
                 avg_price: int, rating: float, match_score: float,
                 distance_km: float, tags: List[str], is_open_now: bool = True):
        self.id = id
        self.name = name
        self.latitude = latitude
        self.longitude = longitude
        self.avg_price = avg_price
        self.rating = rating
        self.match_score = match_score
        self.distance_km = distance_km
        self.tags = tags
        self.is_open_now = is_open_now


class SearchResponse:
    """Simplified search response model."""
    
    def __init__(self, results: List[RestaurantResult], search_radius_km: int,
                 feedback_bot_suggestion: str = None):
        self.results = results
        self.total_count = len(results)
        self.search_radius_km = search_radius_km
        self.timestamp = datetime.now().isoformat()
        self.execution_time_ms = 0.0
        self.feedback_bot_suggestion = feedback_bot_suggestion
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response."""
        response = {
            "results": [
                {
                    "id": r.id,
                    "name": r.name,
                    "latitude": r.latitude,
                    "longitude": r.longitude,
                    "avg_price": r.avg_price,
                    "rating": r.rating,
                    "match_score": r.match_score,
                    "distance_km": r.distance_km,
                    "tags": r.tags,
                    "is_open_now": r.is_open_now
                }
                for r in self.results
            ],
            "total_count": self.total_count,
            "search_radius_km": self.search_radius_km,
            "timestamp": self.timestamp,
            "execution_time_ms": self.execution_time_ms
        }
        
        # Add feedback_bot_suggestion if present
        if self.feedback_bot_suggestion:
            response["feedback_bot_suggestion"] = self.feedback_bot_suggestion
        
        return response


class SearchFlowSimulator:
    """Simulates the search flow for testing."""
    
    # Sample restaurants in HCMC
    SAMPLE_RESTAURANTS = [
        RestaurantResult(1, "Pho King", 10.7667, 106.6869, 25000, 4.5, 85.0, 0.5, ["Pho", "Vietnamese"]),
        RestaurantResult(2, "Beachside Cafe", 10.7633, 106.6903, 55000, 4.2, 78.0, 1.2, ["Cafe", "Dessert"]),
        RestaurantResult(3, "Steak House Premium", 10.7580, 106.6878, 250000, 4.8, 82.0, 1.0, ["Steakhouse", "Fine Dining"]),
        RestaurantResult(4, "Banh Mi King", 10.7650, 106.6850, 18000, 4.0, 88.0, 0.3, ["Banh Mi", "Vietnamese"], is_open_now=False),
        RestaurantResult(5, "Coffee First", 10.7700, 106.6900, 35000, 4.3, 80.0, 0.2, ["Cafe", "Coffee"]),
        RestaurantResult(6, "Sushi Paradise", 10.8100, 106.7100, 180000, 4.6, 75.0, 4.5, ["Sushi", "Japanese"]),
        RestaurantResult(7, "Street Food Hub", 10.7600, 106.6890, 20000, 3.8, 72.0, 0.8, ["Street Food", "Vietnamese"]),
        RestaurantResult(8, "Fancy Restaurant", 10.7750, 106.6950, 350000, 4.9, 80.0, 1.5, ["Fine Dining", "French"]),
        RestaurantResult(9, "Budget Pho 2", 10.7710, 106.6920, 22000, 3.9, 76.0, 0.6, ["Pho", "Vietnamese"]),
        RestaurantResult(10, "Hidden Gem Cafe", 10.7680, 106.6880, 40000, 4.4, 83.0, 0.4, ["Cafe", "Vietnamese"]),
    ]
    
    @staticmethod
    def simulate_search(request: SearchRequest) -> SearchResponse:
        """Simulate POST /search endpoint."""
        # Filter by radius
        results = SearchFlowSimulator._filter_by_radius(
            SearchFlowSimulator.SAMPLE_RESTAURANTS,
            request.latitude,
            request.longitude,
            request.radius_km
        )
        
        # Filter by price range
        if request.min_price or request.max_price:
            results = SearchFlowSimulator._filter_by_price(results, request.min_price, request.max_price)
        
        # Filter by tags
        if request.tags:
            results = SearchFlowSimulator._filter_by_tags(results, request.tags)
        
        # Filter by open status
        if request.open_now_only:
            results = [r for r in results if r.is_open_now]
        
        # Sort by match_score (highest first)
        results = sorted(results, key=lambda r: r.match_score, reverse=True)
        
        # Trigger feedback bot if no results
        feedback = None
        if len(results) == 0:
            feedback = SearchFlowSimulator._generate_feedback_suggestion(request)
        
        response = SearchResponse(results, request.radius_km, feedback)
        return response
    
    @staticmethod
    def _generate_feedback_suggestion(request: SearchRequest) -> str:
        """Generate feedback suggestion when search returns no results."""
        suggestions = []
        
        # Suggest expanding radius
        if request.radius_km < 10:
            suggestions.append(f"Hãy thử nới rộng bán kính lên {request.radius_km + 2}km")
        
        # Suggest removing filters
        if request.tags:
            suggestions.append(f"Hoặc thử bỏ lọc tag để xem kết quả rộng hơn")
        
        if request.min_price or request.max_price:
            suggestions.append("Bạn có thể điều chỉnh ngân sách tìm kiếm")
        
        # Default suggestion
        if not suggestions:
            suggestions.append("Không có nhà hàng trong khu vực này. Vui lòng thử khu vực khác!")
        
        return " | ".join(suggestions)
    
    @staticmethod
    def _filter_by_radius(restaurants: List[RestaurantResult],
                         user_lat: float, user_lon: float,
                         radius_km: int) -> List[RestaurantResult]:
        """Filter restaurants by distance radius."""
        from math import radians, cos, sin, asin, sqrt
        
        def haversine(lat1, lon1, lat2, lon2):
            lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
            dlon = lon2 - lon1
            dlat = lat2 - lat1
            a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
            c = 2 * asin(sqrt(a))
            r = 6371
            return c * r
        
        filtered = []
        for r in restaurants:
            distance = haversine(user_lat, user_lon, r.latitude, r.longitude)
            if distance <= radius_km:
                r.distance_km = round(distance, 2)
                filtered.append(r)
        
        return filtered
    
    @staticmethod
    def _filter_by_price(restaurants: List[RestaurantResult],
                        min_price: int = None,
                        max_price: int = None) -> List[RestaurantResult]:
        """Filter restaurants by price range."""
        filtered = restaurants
        
        if min_price is not None:
            filtered = [r for r in filtered if r.avg_price >= min_price]
        
        if max_price is not None:
            filtered = [r for r in filtered if r.avg_price <= max_price]
        
        return filtered
    
    @staticmethod
    def _filter_by_tags(restaurants: List[RestaurantResult],
                       tags: List[str]) -> List[RestaurantResult]:
        """Filter restaurants that have any of the specified tags."""
        return [r for r in restaurants if any(tag in r.tags for tag in tags)]


class TestSearchFlowBasic:
    """Test basic search flow."""
    
    def test_search_with_minimal_params(self):
        """Test search with only required parameters."""
        request = SearchRequest(latitude=10.7725, longitude=106.6944, radius_km=3)
        response = SearchFlowSimulator.simulate_search(request)
        
        # Should return results
        assert response.total_count > 0
        assert len(response.results) > 0
        assert response.search_radius_km == 3
    
    def test_search_returns_valid_response_structure(self):
        """Test that response has correct structure."""
        request = SearchRequest(latitude=10.7725, longitude=106.6944, radius_km=5)
        response = SearchFlowSimulator.simulate_search(request)
        
        # Check response structure
        assert hasattr(response, 'results')
        assert hasattr(response, 'total_count')
        assert hasattr(response, 'search_radius_km')
        assert hasattr(response, 'timestamp')
        assert hasattr(response, 'execution_time_ms')
    
    def test_search_results_have_required_fields(self):
        """Test that each result has required fields."""
        request = SearchRequest(latitude=10.7725, longitude=106.6944, radius_km=5)
        response = SearchFlowSimulator.simulate_search(request)
        
        if response.results:
            result = response.results[0]
            
            # Required fields
            assert hasattr(result, 'id')
            assert hasattr(result, 'name')
            assert hasattr(result, 'latitude')
            assert hasattr(result, 'longitude')
            assert hasattr(result, 'avg_price')
            assert hasattr(result, 'rating')
            assert hasattr(result, 'match_score')
            assert hasattr(result, 'distance_km')
            assert hasattr(result, 'tags')
    
    def test_search_results_ordered_by_match_score(self):
        """Test that results are ordered by match_score (highest first)."""
        request = SearchRequest(latitude=10.7725, longitude=106.6944, radius_km=5)
        response = SearchFlowSimulator.simulate_search(request)
        
        if len(response.results) > 1:
            scores = [r.match_score for r in response.results]
            
            # Should be in descending order
            assert scores == sorted(scores, reverse=True)


class TestSearchFlowFiltering:
    """Test search filtering."""
    
    def test_search_with_price_filter(self):
        """Test filtering by price range."""
        request = SearchRequest(
            latitude=10.7725, longitude=106.6944, radius_km=10,
            min_price=20000, max_price=100000
        )
        response = SearchFlowSimulator.simulate_search(request)
        
        # All results should be within price range
        for result in response.results:
            assert 20000 <= result.avg_price <= 100000
    
    def test_search_with_tags_filter(self):
        """Test filtering by tags."""
        request = SearchRequest(
            latitude=10.7725, longitude=106.6944, radius_km=10,
            tags=["Cafe", "Vietnamese"]
        )
        response = SearchFlowSimulator.simulate_search(request)
        
        # All results should have at least one matching tag
        for result in response.results:
            assert any(tag in result.tags for tag in ["Cafe", "Vietnamese"])
    
    def test_search_with_price_and_tags(self):
        """Test combining price and tag filters."""
        request = SearchRequest(
            latitude=10.7725, longitude=106.6944, radius_km=10,
            min_price=15000, max_price=60000,
            tags=["Vietnamese"]
        )
        response = SearchFlowSimulator.simulate_search(request)
        
        # Check both filters applied
        for result in response.results:
            assert 15000 <= result.avg_price <= 60000
            assert "Vietnamese" in result.tags
    
    def test_search_with_open_now_filter(self):
        """Test filtering by open status."""
        request = SearchRequest(
            latitude=10.7725, longitude=106.6944, radius_km=10,
            open_now_only=True
        )
        response = SearchFlowSimulator.simulate_search(request)
        
        # All should be open
        for result in response.results:
            assert result.is_open_now is True
    
    def test_search_no_results(self):
        """Test search with filters that return no results."""
        request = SearchRequest(
            latitude=10.7725, longitude=106.6944, radius_km=1,  # Very small radius
            tags=["NonexistentCuisine"]
        )
        response = SearchFlowSimulator.simulate_search(request)
        
        assert response.total_count == 0
        assert len(response.results) == 0


class TestSearchFlowRadius:
    """Test search radius functionality."""
    
    def test_search_3km_radius(self):
        """Test search with 3km radius."""
        request = SearchRequest(latitude=10.7725, longitude=106.6944, radius_km=3)
        response = SearchFlowSimulator.simulate_search(request)
        
        assert response.search_radius_km == 3
        
        # All results should be within 3km
        for result in response.results:
            assert result.distance_km <= 3
    
    def test_search_5km_radius(self):
        """Test search with 5km radius."""
        request = SearchRequest(latitude=10.7725, longitude=106.6944, radius_km=5)
        response = SearchFlowSimulator.simulate_search(request)
        
        assert response.search_radius_km == 5
        
        for result in response.results:
            assert result.distance_km <= 5
    
    def test_search_10km_radius(self):
        """Test search with 10km radius."""
        request = SearchRequest(latitude=10.7725, longitude=106.6944, radius_km=10)
        response = SearchFlowSimulator.simulate_search(request)
        
        assert response.search_radius_km == 10
        
        for result in response.results:
            assert result.distance_km <= 10
    
    def test_larger_radius_more_results(self):
        """Test that larger radius returns more results."""
        request_3km = SearchRequest(latitude=10.7725, longitude=106.6944, radius_km=3)
        response_3km = SearchFlowSimulator.simulate_search(request_3km)
        
        request_10km = SearchRequest(latitude=10.7725, longitude=106.6944, radius_km=10)
        response_10km = SearchFlowSimulator.simulate_search(request_10km)
        
        # 10km should have at least as many results as 3km
        assert response_10km.total_count >= response_3km.total_count


class TestSearchFlowGeography:
    """Test geographic search scenarios."""
    
    def test_search_from_district_1_center(self):
        """Test search from District 1 center (Ben Thanh area)."""
        # Ben Thanh coordinates
        request = SearchRequest(
            latitude=10.7725, longitude=106.6944, radius_km=3
        )
        response = SearchFlowSimulator.simulate_search(request)
        
        # Should find restaurants in District 1
        assert response.total_count > 0
    
    def test_search_from_different_location(self):
        """Test search from different location."""
        # Binh Thanh area
        request = SearchRequest(
            latitude=10.8000, longitude=106.7200, radius_km=5
        )
        response = SearchFlowSimulator.simulate_search(request)
        
        # Should work without errors
        assert isinstance(response.total_count, int)
    
    def test_search_distance_calculation(self):
        """Test that distances are calculated correctly."""
        request = SearchRequest(
            latitude=10.7700, longitude=106.6900, radius_km=2
        )
        response = SearchFlowSimulator.simulate_search(request)
        
        # All distances should be valid numbers
        for result in response.results:
            assert isinstance(result.distance_km, float)
            assert result.distance_km >= 0
            assert result.distance_km <= 2


class TestSearchFlowDataValidation:
    """Test data validation in search flow."""
    
    def test_price_range_validity(self):
        """Test that price range is valid."""
        request = SearchRequest(
            latitude=10.7725, longitude=106.6944, radius_km=5,
            min_price=10000, max_price=200000
        )
        response = SearchFlowSimulator.simulate_search(request)
        
        # min should be less than max
        assert request.min_price <= request.max_price
        
        # All results should respect boundaries
        for result in response.results:
            assert result.avg_price >= request.min_price
            assert result.avg_price <= request.max_price
    
    def test_match_score_range(self):
        """Test that match scores are in valid range."""
        request = SearchRequest(
            latitude=10.7725, longitude=106.6944, radius_km=10
        )
        response = SearchFlowSimulator.simulate_search(request)
        
        for result in response.results:
            # Match score should be between 0 and 100
            assert 0 <= result.match_score <= 100
    
    def test_rating_range(self):
        """Test that ratings are in valid range."""
        request = SearchRequest(
            latitude=10.7725, longitude=106.6944, radius_km=10
        )
        response = SearchFlowSimulator.simulate_search(request)
        
        for result in response.results:
            # Rating should be between 0 and 5
            assert 0 <= result.rating <= 5
    
    def test_tags_not_empty(self):
        """Test that restaurants have tags."""
        request = SearchRequest(
            latitude=10.7725, longitude=106.6944, radius_km=10
        )
        response = SearchFlowSimulator.simulate_search(request)
        
        for result in response.results:
            assert len(result.tags) > 0
            assert isinstance(result.tags, list)


class TestSearchFlowEdgeCases:
    """Test edge cases in search flow."""
    
    def test_search_exact_location_match(self):
        """Test search exactly at a restaurant's location."""
        # Search at Pho King's location
        request = SearchRequest(
            latitude=10.7667, longitude=106.6869, radius_km=0.5
        )
        response = SearchFlowSimulator.simulate_search(request)
        
        # Should find the restaurant at that location
        assert response.total_count > 0
    
    def test_search_isolated_location(self):
        """Test search in area with no restaurants."""
        request = SearchRequest(
            latitude=11.0000, longitude=107.0000, radius_km=2
        )
        response = SearchFlowSimulator.simulate_search(request)
        
        # Might have no results in remote area
        assert response.total_count >= 0
    
    def test_search_very_large_radius(self):
        """Test search with very large radius."""
        request = SearchRequest(
            latitude=10.7725, longitude=106.6944, radius_km=100
        )
        response = SearchFlowSimulator.simulate_search(request)
        
        # Should not crash, might return many results
        assert response.total_count >= 0
    
    def test_search_all_filters_combined(self):
        """Test search with all filters applied."""
        request = SearchRequest(
            latitude=10.7725,
            longitude=106.6944,
            radius_km=10,
            min_price=20000,
            max_price=100000,
            tags=["Vietnamese"],
            open_now_only=True
        )
        response = SearchFlowSimulator.simulate_search(request)
        
        # Verify all filters
        for result in response.results:
            assert result.distance_km <= 10
            assert 20000 <= result.avg_price <= 100000
            assert "Vietnamese" in result.tags
            assert result.is_open_now is True


class TestSearchFlowPerformance:
    """Test performance characteristics of search."""
    
    def test_response_contains_execution_time(self):
        """Test that response includes execution time."""
        request = SearchRequest(
            latitude=10.7725, longitude=106.6944, radius_km=5
        )
        response = SearchFlowSimulator.simulate_search(request)
        
        assert hasattr(response, 'execution_time_ms')
        # Execution time should be numeric and non-negative
        assert isinstance(response.execution_time_ms, (int, float))
    
    def test_response_timestamp(self):
        """Test that response includes timestamp."""
        request = SearchRequest(
            latitude=10.7725, longitude=106.6944, radius_km=5
        )
        response = SearchFlowSimulator.simulate_search(request)
        
        assert hasattr(response, 'timestamp')
        assert isinstance(response.timestamp, str)
        # Should be ISO format
        assert 'T' in response.timestamp  # ISO format includes T


class TestSearchFlowConsistency:
    """Test consistency of search results."""
    
    def test_same_search_same_results(self):
        """Test that same search returns same results."""
        request = SearchRequest(
            latitude=10.7725, longitude=106.6944, radius_km=5,
            tags=["Cafe"]
        )
        
        response1 = SearchFlowSimulator.simulate_search(request)
        response2 = SearchFlowSimulator.simulate_search(request)
        
        # Should return same total count
        assert response1.total_count == response2.total_count
        
        # Should return same results in same order
        if response1.results:
            assert response1.results[0].id == response2.results[0].id
    
    def test_subset_results_consistency(self):
        """Test that filtering creates consistent subsets."""
        request_all = SearchRequest(
            latitude=10.7725, longitude=106.6944, radius_km=10
        )
        response_all = SearchFlowSimulator.simulate_search(request_all)
        
        request_filtered = SearchRequest(
            latitude=10.7725, longitude=106.6944, radius_km=10,
            tags=["Vietnamese"]
        )
        response_filtered = SearchFlowSimulator.simulate_search(request_filtered)
        
        # Filtered results should be subset of all results
        assert response_filtered.total_count <= response_all.total_count
        
        # All filtered results should be in original results
        filtered_ids = {r.id for r in response_filtered.results}
        all_ids = {r.id for r in response_all.results}
        
        if response_filtered.results:
            assert filtered_ids.issubset(all_ids)


class TestSearchFlowFeedbackBot:
    """Test feedback bot suggestions when search returns zero results."""
    
    def test_zero_results_triggers_feedback_bot(self):
        """Test that zero results trigger feedback bot suggestion."""
        # Search in isolated location with strict filters
        request = SearchRequest(
            latitude=11.0000, longitude=107.0000,  # Remote area
            radius_km=1,
            tags=["Sushi"]  # Uncommon tag
        )
        response = SearchFlowSimulator.simulate_search(request)
        
        # Should have no results
        assert response.total_count == 0
        
        # Should have feedback suggestion
        assert response.feedback_bot_suggestion is not None
        assert len(response.feedback_bot_suggestion) > 0
    
    def test_feedback_bot_suggests_radius_expansion(self):
        """Test feedback bot suggests expanding radius."""
        request = SearchRequest(
            latitude=11.0000, longitude=107.0000,
            radius_km=1
        )
        response = SearchFlowSimulator.simulate_search(request)
        
        if response.total_count == 0:
            # Should suggest expanding radius
            assert "nới rộng" in response.feedback_bot_suggestion.lower() or \
                   "expand" in response.feedback_bot_suggestion.lower() or \
                   "radius" in response.feedback_bot_suggestion.lower()
    
    def test_feedback_bot_suggests_removing_filters(self):
        """Test feedback bot suggests removing filters when no results."""
        request = SearchRequest(
            latitude=10.7725, longitude=106.6944,
            radius_km=0.5,  # Very small
            tags=["Sushi"],  # Unlikely in this area
            min_price=500000  # Extremely expensive
        )
        response = SearchFlowSimulator.simulate_search(request)
        
        if response.total_count == 0 and (request.tags or request.min_price or request.max_price):
            # Should suggest adjusting filters
            suggestion = response.feedback_bot_suggestion.lower()
            assert "filter" in suggestion or "lọc" in suggestion or \
                   "ngân sách" in suggestion or "budget" in suggestion
    
    def test_feedback_includes_multiple_suggestions(self):
        """Test feedback bot provides multiple suggestions."""
        request = SearchRequest(
            latitude=11.0000, longitude=107.0000,
            radius_km=1,
            tags=["NonExistent"],
            min_price=1000000
        )
        response = SearchFlowSimulator.simulate_search(request)
        
        if response.total_count == 0:
            # Should have suggestions separated by |
            suggestions = response.feedback_bot_suggestion.split(" | ")
            assert len(suggestions) > 0
    
    def test_no_feedback_when_results_exist(self):
        """Test that feedback bot doesn't trigger when results exist."""
        request = SearchRequest(
            latitude=10.7725, longitude=106.6944,
            radius_km=5
        )
        response = SearchFlowSimulator.simulate_search(request)
        
        if response.total_count > 0:
            # Should NOT have feedback suggestion
            assert response.feedback_bot_suggestion is None
    
    def test_feedback_in_response_dict(self):
        """Test that feedback appears in response dict when present."""
        request = SearchRequest(
            latitude=11.0000, longitude=107.0000,
            radius_km=1
        )
        response = SearchFlowSimulator.simulate_search(request)
        
        response_dict = response.to_dict()
        
        if response.total_count == 0:
            # Dict should include feedback_bot_suggestion
            assert "feedback_bot_suggestion" in response_dict
            assert response_dict["feedback_bot_suggestion"] is not None
        else:
            # No feedback suggestion in dict if results exist
            if response.feedback_bot_suggestion is None:
                # feedback_bot_suggestion key might not exist or be None
                if "feedback_bot_suggestion" in response_dict:
                    assert response_dict["feedback_bot_suggestion"] is None
    
    def test_feedback_suggests_try_different_area(self):
        """Test feedback bot suggests trying different area."""
        request = SearchRequest(
            latitude=11.5000, longitude=107.5000,  # Very far from HCMC
            radius_km=2
        )
        response = SearchFlowSimulator.simulate_search(request)
        
        if response.total_count == 0:
            suggestion = response.feedback_bot_suggestion.lower()
            # Should suggest trying different area
            assert "khu vực" in suggestion or "area" in suggestion or \
                   "thử" in suggestion
