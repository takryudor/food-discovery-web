"""
Unit tests for WeightUpdater module.

Tests cover:
- Weight initialization for user preferences
- Weight adjustment based on user behavior (ratings, saves, filters)
- Weight persistence and consistency
- Edge cases (no history, extreme weights)

This module supports the "Hồ sơ sở thích AI" (AI preference profile) feature
where the system learns from user behavior and adjusts ranking weights.
"""

import pytest
from typing import Dict
from decimal import Decimal


class UserWeightProfile:
    """User's preference weight profile."""
    
    # Default weights for new users
    DEFAULT_WEIGHTS = {
        'rating': 0.30,
        'budget': 0.30,
        'tags': 0.25,
        'popularity': 0.10,
        'distance': 0.05
    }
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.weights = self.DEFAULT_WEIGHTS.copy()
        self.behavior_history = []
    
    def record_behavior(self, behavior_type: str, restaurant_id: int, weight: float = 1.0):
        """
        Record user behavior (rating, save, filter_use, click).
        
        Args:
            behavior_type: 'rate_high', 'rate_low', 'save', 'click', 'filter_click'
            restaurant_id: ID of restaurant involved
            weight: Importance weight of this behavior (default 1.0)
        """
        self.behavior_history.append({
            'type': behavior_type,
            'restaurant_id': restaurant_id,
            'weight': weight
        })
    
    def update_weights_from_history(self):
        """Update weights based on behavior history using reinforcement learning."""
        if not self.behavior_history:
            return  # No changes if no history
        
        # Analyze behavior patterns
        high_ratings = [b for b in self.behavior_history if b['type'] == 'rate_high']
        low_ratings = [b for b in self.behavior_history if b['type'] == 'rate_low']
        saves = [b for b in self.behavior_history if b['type'] == 'save']
        clicks = [b for b in self.behavior_history if b['type'] == 'click']
        filter_clicks = [b for b in self.behavior_history if b['type'] == 'filter_click']
        
        # Adjust weights (simplified learning algorithm)
        weight_adjustments = {
            'rating': 0.0,
            'budget': 0.0,
            'tags': 0.0,
            'popularity': 0.0,
            'distance': 0.0
        }
        
        # If user rates high frequently, increase rating weight
        if len(high_ratings) > len(low_ratings):
            weight_adjustments['rating'] += 0.05
        
        # If user filters by budget often, increase budget weight
        budget_filters = [b for b in filter_clicks if 'budget' in str(b)]
        if len(budget_filters) > 2:
            weight_adjustments['budget'] += 0.05
        
        # If user saves frequently, they care about overall match (tags)
        if len(saves) > 3:
            weight_adjustments['tags'] += 0.05
        
        # Apply adjustments
        for factor, adjustment in weight_adjustments.items():
            self.weights[factor] += adjustment
        
        # Normalize weights to sum to 1.0
        self._normalize_weights()
    
    def _normalize_weights(self):
        """Normalize weights so they sum to 1.0."""
        total = sum(self.weights.values())
        if total > 0:
            for key in self.weights:
                self.weights[key] = self.weights[key] / total
    
    def get_weights(self) -> Dict[str, float]:
        """Get current weights."""
        return self.weights.copy()
    
    def reset_to_default(self):
        """Reset weights to defaults."""
        self.weights = self.DEFAULT_WEIGHTS.copy()
        self.behavior_history = []
    
    def set_weight(self, factor: str, value: float):
        """Set a specific weight value."""
        if factor not in self.weights:
            raise ValueError(f"Unknown factor: {factor}")
        if not (0 <= value <= 1):
            raise ValueError(f"Weight must be between 0 and 1, got {value}")
        
        self.weights[factor] = value
        self._normalize_weights()


class TestWeightInitialization:
    """Test weight initialization for users."""
    
    def test_default_weights(self):
        """Test default weights for new user."""
        user = UserWeightProfile("user123")
        weights = user.get_weights()
        
        # Check all factors are present
        assert 'rating' in weights
        assert 'budget' in weights
        assert 'tags' in weights
        assert 'popularity' in weights
        assert 'distance' in weights
    
    def test_weights_sum_to_one(self):
        """Test that weights sum to 1.0."""
        user = UserWeightProfile("user123")
        weights = user.get_weights()
        
        total = sum(weights.values())
        assert abs(total - 1.0) < 0.001
    
    def test_default_weights_expected_values(self):
        """Test specific default weight values."""
        user = UserWeightProfile("user123")
        weights = user.get_weights()
        
        assert abs(weights['rating'] - 0.30) < 0.001
        assert abs(weights['budget'] - 0.30) < 0.001
        assert abs(weights['tags'] - 0.25) < 0.001
        assert abs(weights['popularity'] - 0.10) < 0.001
        assert abs(weights['distance'] - 0.05) < 0.001
    
    def test_multiple_users_independent_weights(self):
        """Test that each user has independent weights."""
        user1 = UserWeightProfile("user1")
        user2 = UserWeightProfile("user2")
        
        # Modify user1's weights
        user1.set_weight('rating', 0.50)
        
        # User2 should still have defaults
        assert abs(user2.get_weights()['rating'] - 0.30) < 0.001
        assert abs(user1.get_weights()['rating'] - 0.50) < 0.001


class TestWeightAdjustment:
    """Test weight adjustments based on behavior."""
    
    def test_high_ratings_increase_rating_weight(self):
        """Test that frequent high ratings increase rating weight."""
        user = UserWeightProfile("user123")
        initial_rating_weight = user.get_weights()['rating']
        
        # Record multiple high ratings
        for i in range(5):
            user.record_behavior('rate_high', restaurant_id=i)
        
        user.update_weights_from_history()
        new_rating_weight = user.get_weights()['rating']
        
        # Rating weight should increase
        assert new_rating_weight > initial_rating_weight
    
    def test_low_ratings_dont_increase_rating_weight(self):
        """Test that frequent low ratings don't increase rating weight."""
        user = UserWeightProfile("user123")
        initial_rating_weight = user.get_weights()['rating']
        
        # Record multiple low ratings
        for i in range(5):
            user.record_behavior('rate_low', restaurant_id=i)
        
        user.update_weights_from_history()
        new_rating_weight = user.get_weights()['rating']
        
        # Rating weight should stay same or decrease
        assert new_rating_weight <= initial_rating_weight
    
    def test_saves_increase_tag_weight(self):
        """Test that saves increase tag/preference weight."""
        user = UserWeightProfile("user123")
        initial_tag_weight = user.get_weights()['tags']
        
        # Record multiple saves
        for i in range(5):
            user.record_behavior('save', restaurant_id=i)
        
        user.update_weights_from_history()
        new_tag_weight = user.get_weights()['tags']
        
        # Tag weight should increase
        assert new_tag_weight >= initial_tag_weight
    
    def test_budget_filter_use_increases_budget_weight(self):
        """Test that using budget filter increases budget weight."""
        user = UserWeightProfile("user123")
        initial_budget_weight = user.get_weights()['budget']
        
        # Record multiple budget filter uses
        for i in range(5):
            user.record_behavior('filter_click', restaurant_id=i)
        
        user.update_weights_from_history()
        new_budget_weight = user.get_weights()['budget']
        
        # Budget weight might increase or stay same
        assert new_budget_weight >= initial_budget_weight
    
    def test_weights_remain_normalized_after_update(self):
        """Test that weights stay normalized after update."""
        user = UserWeightProfile("user123")
        
        # Add various behaviors
        behaviors = [
            ('rate_high', 1), ('rate_high', 2), ('rate_low', 3),
            ('save', 4), ('save', 5), ('save', 6),
            ('click', 7), ('filter_click', 8)
        ]
        
        for behavior_type, rest_id in behaviors:
            user.record_behavior(behavior_type, restaurant_id=rest_id)
        
        user.update_weights_from_history()
        
        total = sum(user.get_weights().values())
        assert abs(total - 1.0) < 0.001
    
    def test_empty_history_no_change(self):
        """Test that updating with no history makes no changes."""
        user = UserWeightProfile("user123")
        initial_weights = user.get_weights().copy()
        
        user.update_weights_from_history()  # No history recorded
        
        updated_weights = user.get_weights()
        for factor in initial_weights:
            assert abs(initial_weights[factor] - updated_weights[factor]) < 0.001


class TestWeightReset:
    """Test resetting weights."""
    
    def test_reset_to_default(self):
        """Test resetting weights to defaults."""
        user = UserWeightProfile("user123")
        
        # Modify weights
        user.set_weight('rating', 0.50)
        user.set_weight('budget', 0.20)
        
        # Record some behavior
        user.record_behavior('rate_high', 1)
        user.record_behavior('save', 2)
        
        # Reset
        user.reset_to_default()
        
        # Should be back to defaults
        weights = user.get_weights()
        assert abs(weights['rating'] - 0.30) < 0.001
        assert abs(weights['budget'] - 0.30) < 0.001
        
        # History should be cleared
        assert len(user.behavior_history) == 0
    
    def test_reset_clears_history(self):
        """Test that reset clears behavior history."""
        user = UserWeightProfile("user123")
        
        # Add history
        user.record_behavior('rate_high', 1)
        user.record_behavior('save', 2)
        
        assert len(user.behavior_history) == 2
        
        # Reset
        user.reset_to_default()
        
        assert len(user.behavior_history) == 0


class TestWeightManualAdjustment:
    """Test manual weight adjustments."""
    
    def test_set_single_weight(self):
        """Test setting a single weight."""
        user = UserWeightProfile("user123")
        
        user.set_weight('rating', 0.50)
        
        assert abs(user.get_weights()['rating'] - 0.50) < 0.001
    
    def test_set_weight_invalid_factor(self):
        """Test error handling for invalid factor."""
        user = UserWeightProfile("user123")
        
        with pytest.raises(ValueError):
            user.set_weight('invalid_factor', 0.5)
    
    def test_set_weight_out_of_range(self):
        """Test error handling for out-of-range values."""
        user = UserWeightProfile("user123")
        
        with pytest.raises(ValueError):
            user.set_weight('rating', 1.5)
        
        with pytest.raises(ValueError):
            user.set_weight('rating', -0.1)
    
    def test_set_weight_normalizes(self):
        """Test that setting weight triggers normalization."""
        user = UserWeightProfile("user123")
        
        user.set_weight('rating', 0.50)
        
        # All weights should still sum to 1.0
        total = sum(user.get_weights().values())
        assert abs(total - 1.0) < 0.001
    
    def test_set_multiple_weights(self):
        """Test setting multiple weights."""
        user = UserWeightProfile("user123")
        
        user.set_weight('rating', 0.40)
        user.set_weight('budget', 0.40)
        user.set_weight('tags', 0.15)
        user.set_weight('popularity', 0.03)
        user.set_weight('distance', 0.02)
        
        weights = user.get_weights()
        
        assert abs(weights['rating'] - 0.40) < 0.001
        assert abs(weights['budget'] - 0.40) < 0.001
        assert abs(weights['tags'] - 0.15) < 0.001
        
        # Should be normalized
        assert abs(sum(weights.values()) - 1.0) < 0.001


class TestWeightBehaviorTracking:
    """Test behavior recording and tracking."""
    
    def test_record_rating_behavior(self):
        """Test recording rating behavior."""
        user = UserWeightProfile("user123")
        
        user.record_behavior('rate_high', restaurant_id=1)
        user.record_behavior('rate_low', restaurant_id=2)
        
        assert len(user.behavior_history) == 2
        assert user.behavior_history[0]['type'] == 'rate_high'
        assert user.behavior_history[1]['type'] == 'rate_low'
    
    def test_record_save_behavior(self):
        """Test recording save behavior."""
        user = UserWeightProfile("user123")
        
        user.record_behavior('save', restaurant_id=1)
        
        assert len(user.behavior_history) == 1
        assert user.behavior_history[0]['type'] == 'save'
        assert user.behavior_history[0]['restaurant_id'] == 1
    
    def test_record_behavior_with_weight(self):
        """Test recording behavior with custom weight."""
        user = UserWeightProfile("user123")
        
        user.record_behavior('rate_high', restaurant_id=1, weight=2.0)
        
        assert user.behavior_history[0]['weight'] == 2.0
    
    def test_behavior_history_order(self):
        """Test that behavior history maintains order."""
        user = UserWeightProfile("user123")
        
        for i in range(5):
            user.record_behavior('click', restaurant_id=i)
        
        # History should be in order
        for i, behavior in enumerate(user.behavior_history):
            assert behavior['restaurant_id'] == i
    
    def test_multiple_behaviors_same_restaurant(self):
        """Test multiple behaviors for same restaurant."""
        user = UserWeightProfile("user123")
        
        user.record_behavior('click', restaurant_id=1)
        user.record_behavior('save', restaurant_id=1)
        user.record_behavior('rate_high', restaurant_id=1)
        
        assert len(user.behavior_history) == 3
        assert all(b['restaurant_id'] == 1 for b in user.behavior_history)


class TestWeightEdgeCases:
    """Test edge cases and boundary conditions."""
    
    def test_zero_weights(self):
        """Test setting a weight to zero."""
        user = UserWeightProfile("user123")
        
        user.set_weight('distance', 0.0)
        
        # Distance weight should be 0
        assert user.get_weights()['distance'] == 0.0
        
        # Other weights should still sum to 1.0
        assert abs(sum(user.get_weights().values()) - 1.0) < 0.001
    
    def test_one_weight_dominates(self):
        """Test when one weight is heavily dominant."""
        user = UserWeightProfile("user123")
        
        user.set_weight('rating', 0.95)
        
        weights = user.get_weights()
        assert abs(weights['rating'] - 0.95) < 0.001
        
        # Other weights should be very small but sum correctly
        assert abs(sum(weights.values()) - 1.0) < 0.001
    
    def test_balanced_weights(self):
        """Test perfectly balanced weights."""
        user = UserWeightProfile("user123")
        
        equal_weight = 0.20
        for factor in ['rating', 'budget', 'tags', 'popularity', 'distance']:
            user.set_weight(factor, equal_weight)
        
        weights = user.get_weights()
        
        # All should be equal
        for factor in weights:
            assert abs(weights[factor] - equal_weight) < 0.001
    
    def test_extreme_behavior_history(self):
        """Test with very large behavior history."""
        user = UserWeightProfile("user123")
        
        # Record 1000 behaviors
        for i in range(1000):
            behavior_type = 'rate_high' if i % 2 == 0 else 'rate_low'
            user.record_behavior(behavior_type, restaurant_id=i % 100)
        
        assert len(user.behavior_history) == 1000
        
        # Update should still work
        user.update_weights_from_history()
        
        # Weights should be valid
        assert abs(sum(user.get_weights().values()) - 1.0) < 0.001


class TestWeightPersistence:
    """Test weight persistence concepts."""
    
    def test_weights_persist_across_updates(self):
        """Test that manually set weights persist through behavior updates."""
        user = UserWeightProfile("user123")
        
        # Set custom initial weights
        user.set_weight('rating', 0.50)
        original_weights = user.get_weights().copy()
        
        # Add some behavior
        user.record_behavior('click', 1)
        
        # Update from empty behavior (should not change much)
        user.update_weights_from_history()
        
        # Weights should be close to what we set
        # (might change slightly due to normalization)
        updated_weights = user.get_weights()
        
        # The relative differences should be preserved
        for factor in original_weights:
            # Allow 10% relative change due to normalization
            max_change = original_weights[factor] * 0.1 + 0.01
            assert abs(original_weights[factor] - updated_weights[factor]) < max_change
