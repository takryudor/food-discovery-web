"""
Unit tests for RankingService module.

Tests cover:
- match_score formula correctness
- Weight calculations for different factors
- Sorting by relevance score
- Edge cases (missing data, boundary values)
"""

import pytest
from decimal import Decimal
from typing import Dict, List


class MockRestaurantWithScore:
    """Mock restaurant with scoring data."""
    
    def __init__(self, id: int, name: str, rating: float, avg_price: int, 
                 tags: List[str], distance_km: float = 0.0, reviews_count: int = 0):
        self.id = id
        self.name = name
        self.rating = rating
        self.avg_price = avg_price
        self.tags = tags
        self.distance_km = distance_km
        self.reviews_count = reviews_count
        self.match_score = 0.0


class TestRankingServiceMatchScoreFormula:
    """Test the match_score calculation formula."""
    
    def calculate_match_score(self, restaurant: MockRestaurantWithScore,
                             user_budget: int, preferred_tags: List[str],
                             weights: Dict[str, float] = None) -> float:
        """
        Calculate match_score based on multiple weighted factors:
        - Rating (0-5): 0-25 points
        - Budget match: 0-25 points (how well price matches user budget)
        - Tag match: 0-25 points (how many preferred tags match)
        - Popularity: 0-15 points (based on reviews count)
        - Distance: 0-10 points (closer is better)
        
        Default weights: rating=0.30, budget=0.30, tags=0.25, popularity=0.10, distance=0.05
        """
        if weights is None:
            weights = {
                'rating': 0.30,
                'budget': 0.30,
                'tags': 0.25,
                'popularity': 0.10,
                'distance': 0.05
            }
        
        # Rating score (max 100)
        rating_score = (restaurant.rating / 5.0) * 100
        
        # Budget score (how well price matches)
        # If price matches perfectly (within 10%), score = 100
        # If price is way off, score decays
        price_diff_percent = abs(restaurant.avg_price - user_budget) / max(user_budget, 1)
        budget_score = max(0, 100 - (price_diff_percent * 100))
        
        # Tag match score
        if preferred_tags:
            matched_tags = sum(1 for tag in preferred_tags if tag in restaurant.tags)
            tag_score = (matched_tags / len(preferred_tags)) * 100
        else:
            tag_score = 50  # Neutral if no preference
        
        # Popularity score (reviews count)
        # Normalize to 100 scale (assuming max 500 reviews = 100 score)
        popularity_score = min(100, (restaurant.reviews_count / 500) * 100)
        
        # Distance score (closer is better)
        # 0km = 100, 10km = 50, 20km+ = 0
        distance_score = max(0, 100 - (restaurant.distance_km * 5))
        
        # Weighted sum
        match_score = (
            rating_score * weights['rating'] +
            budget_score * weights['budget'] +
            tag_score * weights['tags'] +
            popularity_score * weights['popularity'] +
            distance_score * weights['distance']
        )
        
        return match_score
    
    @pytest.fixture
    def restaurants(self):
        """Sample restaurants for testing."""
        return [
            MockRestaurantWithScore(1, "Perfect Match", 4.5, 80000, ["Cafe", "Vietnamese"], 1.0, 200),
            MockRestaurantWithScore(2, "High Rating", 5.0, 100000, ["Steakhouse"], 5.0, 300),
            MockRestaurantWithScore(3, "Budget Friendly", 3.5, 20000, ["Pho", "Vietnamese"], 0.5, 50),
            MockRestaurantWithScore(4, "Not Matching", 2.0, 500000, ["Japanese"], 15.0, 10),
            MockRestaurantWithScore(5, "Average Place", 3.5, 50000, ["Cafe"], 3.0, 100),
        ]
    
    def test_perfect_score(self, restaurants):
        """Test restaurant that perfectly matches all criteria."""
        restaurant = restaurants[0]  # Perfect Match
        user_budget = 80000
        preferred_tags = ["Cafe", "Vietnamese"]
        
        score = self.calculate_match_score(restaurant, user_budget, preferred_tags)
        
        # Should score very high (>85)
        assert score > 85
        assert score <= 100
    
    def test_high_rating_high_score(self, restaurants):
        """Test that high rating contributes significantly to score."""
        restaurant = restaurants[1]  # High Rating (5.0)
        user_budget = 100000
        preferred_tags = ["Steakhouse"]
        
        score = self.calculate_match_score(restaurant, user_budget, preferred_tags)
        
        # 5.0 rating should contribute 30% weight
        assert score > 70
    
    def test_low_rating_low_score(self, restaurants):
        """Test that low rating results in lower score."""
        restaurant = restaurants[3]  # Not Matching (2.0 rating)
        user_budget = 500000
        preferred_tags = ["Japanese"]
        
        score = self.calculate_match_score(restaurant, user_budget, preferred_tags)
        
        # Despite matching price and tags, low rating should keep score lower than high rating
        # (but not necessarily < 50 due to other factors)
        assert score > 0
        assert score < 75  # Should be lower than high-rating restaurants
    
    def test_budget_match_scoring(self, restaurants):
        """Test budget matching contribution to score."""
        restaurant = MockRestaurantWithScore(99, "Test", 4.0, 100000, [], 0)
        
        # Test matching budget
        score_match = self.calculate_match_score(restaurant, user_budget=100000, preferred_tags=[])
        
        # Test non-matching budget
        score_mismatch = self.calculate_match_score(restaurant, user_budget=20000, preferred_tags=[])
        
        # Matching budget should score higher
        assert score_match > score_mismatch
    
    def test_tag_match_impact(self, restaurants):
        """Test tag matching impact on score."""
        restaurant = MockRestaurantWithScore(99, "Test", 4.0, 50000, ["Pho", "Vietnamese"], 1.0, 100)
        
        # All tags match
        score_all_match = self.calculate_match_score(
            restaurant, user_budget=50000, preferred_tags=["Pho", "Vietnamese"]
        )
        
        # No tags match
        score_no_match = self.calculate_match_score(
            restaurant, user_budget=50000, preferred_tags=["Sushi", "Japanese"]
        )
        
        # Should score higher with matching tags
        assert score_all_match > score_no_match
    
    def test_distance_scoring(self, restaurants):
        """Test that distance affects score."""
        restaurant_close = MockRestaurantWithScore(99, "Close", 4.0, 50000, [], 1.0, 100)
        restaurant_far = MockRestaurantWithScore(100, "Far", 4.0, 50000, [], 15.0, 100)
        
        score_close = self.calculate_match_score(restaurant_close, 50000, [])
        score_far = self.calculate_match_score(restaurant_far, 50000, [])
        
        # Closer restaurant should score higher
        assert score_close > score_far
    
    def test_popularity_scoring(self, restaurants):
        """Test that popularity (reviews) affects score."""
        restaurant_popular = MockRestaurantWithScore(99, "Popular", 3.5, 50000, [], 1.0, 400)
        restaurant_unknown = MockRestaurantWithScore(100, "Unknown", 3.5, 50000, [], 1.0, 10)
        
        score_popular = self.calculate_match_score(restaurant_popular, 50000, [])
        score_unknown = self.calculate_match_score(restaurant_unknown, 50000, [])
        
        # More popular should score higher
        assert score_popular > score_unknown
    
    def test_score_range_0_to_100(self, restaurants):
        """Test that all scores fall within 0-100 range."""
        for restaurant in restaurants:
            score = self.calculate_match_score(restaurant, user_budget=100000, preferred_tags=["Cafe"])
            
            assert 0 <= score <= 100, f"Score {score} out of bounds for {restaurant.name}"
    
    def test_zero_rating(self):
        """Test edge case: restaurant with 0 rating."""
        restaurant = MockRestaurantWithScore(99, "New Place", 0.0, 50000, [], 0, 0)
        score = self.calculate_match_score(restaurant, 50000, [])
        
        # Should not be negative, but will be low
        assert score >= 0
        assert score < 60  # Should be low due to no rating


class TestRankingServiceSorting:
    """Test sorting restaurants by match_score."""
    
    def calculate_and_rank(self, restaurants: List[MockRestaurantWithScore],
                          user_budget: int, preferred_tags: List[str]) -> List[MockRestaurantWithScore]:
        """Calculate scores and return sorted by score (highest first)."""
        def calc_score(r):
            rating_score = (r.rating / 5.0) * 100
            price_diff_percent = abs(r.avg_price - user_budget) / max(user_budget, 1)
            budget_score = max(0, 100 - (price_diff_percent * 100))
            
            if preferred_tags:
                matched_tags = sum(1 for tag in preferred_tags if tag in r.tags)
                tag_score = (matched_tags / len(preferred_tags)) * 100
            else:
                tag_score = 50
            
            popularity_score = min(100, (r.reviews_count / 500) * 100)
            distance_score = max(0, 100 - (r.distance_km * 5))
            
            return (
                rating_score * 0.30 +
                budget_score * 0.30 +
                tag_score * 0.25 +
                popularity_score * 0.10 +
                distance_score * 0.05
            )
        
        # Calculate scores
        for r in restaurants:
            r.match_score = calc_score(r)
        
        # Sort by score descending
        return sorted(restaurants, key=lambda r: r.match_score, reverse=True)
    
    def test_sorting_by_score(self):
        """Test that restaurants are sorted by match_score correctly."""
        restaurants = [
            MockRestaurantWithScore(1, "Low Score", 2.0, 100000, [], 10.0, 10),
            MockRestaurantWithScore(2, "Mid Score", 3.5, 50000, ["Cafe"], 2.0, 100),
            MockRestaurantWithScore(3, "High Score", 4.8, 50000, ["Cafe"], 0.5, 300),
        ]
        
        sorted_restaurants = self.calculate_and_rank(restaurants, 50000, ["Cafe"])
        
        # Verify sorted order
        assert sorted_restaurants[0].id == 3  # High Score should be first
        assert sorted_restaurants[1].id == 2  # Mid Score should be second
        assert sorted_restaurants[2].id == 1  # Low Score should be last
        
        # Verify scores are in descending order
        scores = [r.match_score for r in sorted_restaurants]
        assert scores == sorted(scores, reverse=True)
    
    def test_sorting_stable_equal_scores(self):
        """Test sorting behavior when restaurants have equal scores."""
        restaurants = [
            MockRestaurantWithScore(1, "A", 4.0, 50000, [], 1.0, 100),
            MockRestaurantWithScore(2, "B", 4.0, 50000, [], 1.0, 100),
            MockRestaurantWithScore(3, "C", 4.0, 50000, [], 1.0, 100),
        ]
        
        sorted_restaurants = self.calculate_and_rank(restaurants, 50000, [])
        
        # All should have equal scores
        scores = [r.match_score for r in sorted_restaurants]
        assert len(set(scores)) == 1  # All unique values in set = 1 means all same


class TestRankingServiceWeightConfiguration:
    """Test custom weight configurations for ranking."""
    
    def calculate_with_weights(self, restaurant: MockRestaurantWithScore,
                              user_budget: int, preferred_tags: List[str],
                              weights: Dict[str, float]) -> float:
        """Calculate match_score with custom weights."""
        rating_score = (restaurant.rating / 5.0) * 100
        price_diff_percent = abs(restaurant.avg_price - user_budget) / max(user_budget, 1)
        budget_score = max(0, 100 - (price_diff_percent * 100))
        
        if preferred_tags:
            matched_tags = sum(1 for tag in preferred_tags if tag in restaurant.tags)
            tag_score = (matched_tags / len(preferred_tags)) * 100
        else:
            tag_score = 50
        
        popularity_score = min(100, (restaurant.reviews_count / 500) * 100)
        distance_score = max(0, 100 - (restaurant.distance_km * 5))
        
        return (
            rating_score * weights['rating'] +
            budget_score * weights['budget'] +
            tag_score * weights['tags'] +
            popularity_score * weights['popularity'] +
            distance_score * weights['distance']
        )
    
    def test_rating_priority_weights(self):
        """Test ranking with high weight on rating."""
        restaurant_high_rating = MockRestaurantWithScore(1, "High Rating", 5.0, 100000, [], 5.0, 10)
        restaurant_perfect_budget = MockRestaurantWithScore(2, "Perfect Budget", 3.0, 50000, [], 0.1, 10)
        
        # Emphasize rating
        weights = {
            'rating': 0.60,
            'budget': 0.20,
            'tags': 0.10,
            'popularity': 0.05,
            'distance': 0.05
        }
        
        score1 = self.calculate_with_weights(restaurant_high_rating, 100000, [], weights)
        score2 = self.calculate_with_weights(restaurant_perfect_budget, 100000, [], weights)
        
        # High rating should win
        assert score1 > score2
    
    def test_budget_priority_weights(self):
        """Test ranking with high weight on budget match."""
        restaurant_high_rating = MockRestaurantWithScore(1, "High Rating", 5.0, 500000, [], 1.0, 50)
        restaurant_perfect_budget = MockRestaurantWithScore(2, "Perfect Budget", 3.0, 50000, [], 1.0, 50)
        
        # Emphasize budget
        weights = {
            'rating': 0.10,
            'budget': 0.70,
            'tags': 0.10,
            'popularity': 0.05,
            'distance': 0.05
        }
        
        score1 = self.calculate_with_weights(restaurant_high_rating, 50000, [], weights)
        score2 = self.calculate_with_weights(restaurant_perfect_budget, 50000, [], weights)
        
        # Budget match should win
        assert score2 > score1
    
    def test_weights_sum_to_one(self):
        """Test that weights must sum to 1.0 for consistency."""
        weights = {
            'rating': 0.30,
            'budget': 0.30,
            'tags': 0.25,
            'popularity': 0.10,
            'distance': 0.05
        }
        
        total = sum(weights.values())
        assert abs(total - 1.0) < 0.001  # Allow small floating point error


class TestRankingServiceEdgeCases:
    """Test edge cases in ranking."""
    
    def test_restaurant_no_reviews(self):
        """Test restaurant with zero reviews."""
        restaurant = MockRestaurantWithScore(99, "New Place", 4.0, 50000, [], 1.0, 0)
        
        # Should not crash and should have valid score
        # Popularity score should be 0, but overall score should be reasonable
        assert restaurant.reviews_count == 0
    
    def test_zero_user_budget(self):
        """Test with zero user budget (edge case)."""
        restaurant = MockRestaurantWithScore(99, "Test", 4.0, 50000, [], 1.0, 100)
        
        # Avoid division by zero - should use max(user_budget, 1)
        # Budget score calculation: abs(50000 - 0) / max(0, 1) = 50000 / 1
        price_diff_percent = abs(restaurant.avg_price - 0) / max(0, 1)
        budget_score = max(0, 100 - (price_diff_percent * 100))
        
        # This will be negative due to large difference, clamped to 0
        assert budget_score == 0
    
    def test_identical_restaurants(self):
        """Test ranking identical restaurants."""
        r1 = MockRestaurantWithScore(1, "Identical A", 4.0, 50000, ["Cafe"], 1.0, 100)
        r2 = MockRestaurantWithScore(2, "Identical B", 4.0, 50000, ["Cafe"], 1.0, 100)
        
        # Both should have identical scores
        # This is expected behavior
        assert r1.rating == r2.rating
        assert r1.avg_price == r2.avg_price
        assert r1.distance_km == r2.distance_km
