"""
Unit tests for RadiusManager module.

Tests cover:
- Bán kính tìm kiếm (Search radius calculation)
- Radius presets (3km, 5km, 10km)
- Dynamic radius expansion when results are low
- Edge cases (invalid radius, boundary checks)
"""

import pytest
from typing import List, Tuple


class RadiusManager:
    """Manager for search radius logic."""
    
    # Standard radius presets in kilometers
    RADIUS_PRESETS = [3, 5, 10]
    MIN_RESULTS_THRESHOLD = 5
    EXPANSION_MULTIPLIER = 1.5
    
    @staticmethod
    def validate_radius(radius_km: float) -> bool:
        """Check if radius is valid (positive number)."""
        return radius_km > 0
    
    @staticmethod
    def get_preset_radius(preset_level: int) -> int:
        """
        Get radius from preset level.
        Args:
            preset_level: 0=3km, 1=5km, 2=10km
        Returns:
            Radius in kilometers
        """
        presets = {0: 3, 1: 5, 2: 10}
        if preset_level in presets:
            return presets[preset_level]
        raise ValueError(f"Invalid preset level: {preset_level}")
    
    @staticmethod
    def get_all_presets() -> List[int]:
        """Get all available radius presets."""
        return RadiusManager.RADIUS_PRESETS
    
    @staticmethod
    def auto_expand_radius(current_radius: float, result_count: int,
                          min_threshold: int = MIN_RESULTS_THRESHOLD) -> Tuple[float, bool]:
        """
        Automatically expand search radius if results are below threshold.
        
        Args:
            current_radius: Current search radius in km
            result_count: Number of results found
            min_threshold: Minimum desired results
            
        Returns:
            Tuple of (new_radius, was_expanded)
        """
        if result_count >= min_threshold:
            return current_radius, False
        
        expanded_radius = current_radius * RadiusManager.EXPANSION_MULTIPLIER
        return expanded_radius, True
    
    @staticmethod
    def calculate_search_radius_from_results(results_count: int) -> int:
        """
        Suggest radius based on typical result density for HCMC.
        Assumes ~0.5 restaurants per km² in reasonable areas.
        
        Args:
            results_count: Desired number of results
            
        Returns:
            Suggested radius in kilometers
        """
        if results_count <= 0:
            return 3
        
        # Calculate area needed (assuming ~0.5 restaurants per km²)
        restaurants_per_km2 = 0.5
        area_needed = results_count / restaurants_per_km2
        
        # Calculate radius from area (A = π*r²)
        import math
        radius = math.sqrt(area_needed / math.pi)
        
        # Round up to nearest 0.5 km
        radius = math.ceil(radius * 2) / 2
        
        # Clamp to reasonable limits
        return max(3, min(radius, 20))


class TestRadiusManagerBasics:
    """Test basic radius management functionality."""
    
    def test_radius_validation_positive(self):
        """Test validation of positive radius values."""
        assert RadiusManager.validate_radius(3.0) is True
        assert RadiusManager.validate_radius(5.5) is True
        assert RadiusManager.validate_radius(0.1) is True
    
    def test_radius_validation_zero_and_negative(self):
        """Test that zero and negative radius are invalid."""
        assert RadiusManager.validate_radius(0) is False
        assert RadiusManager.validate_radius(-5) is False
        assert RadiusManager.validate_radius(-0.1) is False
    
    def test_get_preset_radius_valid(self):
        """Test getting preset radius values."""
        assert RadiusManager.get_preset_radius(0) == 3
        assert RadiusManager.get_preset_radius(1) == 5
        assert RadiusManager.get_preset_radius(2) == 10
    
    def test_get_preset_radius_invalid(self):
        """Test error handling for invalid preset level."""
        with pytest.raises(ValueError):
            RadiusManager.get_preset_radius(3)
        
        with pytest.raises(ValueError):
            RadiusManager.get_preset_radius(-1)
    
    def test_get_all_presets(self):
        """Test retrieving all available presets."""
        presets = RadiusManager.get_all_presets()
        
        assert len(presets) == 3
        assert presets == [3, 5, 10]
        assert all(isinstance(p, int) for p in presets)


class TestRadiusManagerAutoExpansion:
    """Test automatic radius expansion when results are low."""
    
    def test_no_expansion_with_sufficient_results(self):
        """Test that radius doesn't expand when results are sufficient."""
        current_radius = 3.0
        result_count = 10  # Above threshold of 5
        
        new_radius, was_expanded = RadiusManager.auto_expand_radius(
            current_radius, result_count
        )
        
        assert was_expanded is False
        assert new_radius == current_radius
    
    def test_expansion_with_few_results(self):
        """Test that radius expands when results are below threshold."""
        current_radius = 3.0
        result_count = 2  # Below threshold of 5
        
        new_radius, was_expanded = RadiusManager.auto_expand_radius(
            current_radius, result_count
        )
        
        assert was_expanded is True
        assert new_radius > current_radius
        assert new_radius == 3.0 * 1.5  # EXPANSION_MULTIPLIER
    
    def test_expansion_multiplier(self):
        """Test that expansion uses correct multiplier."""
        current_radius = 5.0
        
        new_radius, _ = RadiusManager.auto_expand_radius(current_radius, 1)
        
        # Should be 5 * 1.5 = 7.5
        assert abs(new_radius - 7.5) < 0.01
    
    def test_expansion_with_empty_results(self):
        """Test expansion with zero results."""
        current_radius = 3.0
        
        new_radius, was_expanded = RadiusManager.auto_expand_radius(
            current_radius, 0
        )
        
        assert was_expanded is True
        assert new_radius == 4.5  # 3 * 1.5
    
    def test_expansion_boundary_at_threshold(self):
        """Test behavior exactly at threshold."""
        current_radius = 5.0
        min_threshold = 5
        
        # Exactly at threshold - should NOT expand
        new_radius_at, was_expanded_at = RadiusManager.auto_expand_radius(
            current_radius, 5, min_threshold
        )
        assert was_expanded_at is False
        assert new_radius_at == current_radius
        
        # Just below threshold - should expand
        new_radius_below, was_expanded_below = RadiusManager.auto_expand_radius(
            current_radius, 4, min_threshold
        )
        assert was_expanded_below is True
        assert new_radius_below > current_radius
    
    def test_custom_threshold(self):
        """Test auto-expansion with custom threshold."""
        current_radius = 3.0
        result_count = 7
        custom_threshold = 10
        
        new_radius, was_expanded = RadiusManager.auto_expand_radius(
            current_radius, result_count, custom_threshold
        )
        
        # 7 < 10, so should expand
        assert was_expanded is True
        assert new_radius == 4.5


class TestRadiusManagerProgressive:
    """Test progressive radius expansion strategy."""
    
    def test_multiple_expansions(self):
        """Test expanding radius multiple times."""
        initial_radius = 3.0
        radii = [initial_radius]
        
        current_radius = initial_radius
        for i in range(4):
            new_radius, was_expanded = RadiusManager.auto_expand_radius(
                current_radius, 1
            )
            if was_expanded:
                radii.append(new_radius)
                current_radius = new_radius
        
        # Should expand: 3 -> 4.5 -> 6.75 -> 10.125 -> 15.1875
        assert len(radii) > 1
        assert radii[-1] > radii[0]
        
        # Each step should be 1.5x previous
        for i in range(len(radii) - 1):
            ratio = radii[i + 1] / radii[i]
            assert abs(ratio - 1.5) < 0.001
    
    def test_progressive_search_strategy(self):
        """Test progressive search: start small, expand if needed."""
        presets = RadiusManager.get_all_presets()
        
        # Simulate search with increasing radius
        for preset_level in range(len(presets)):
            radius = RadiusManager.get_preset_radius(preset_level)
            assert radius > 0
            assert radius == presets[preset_level]


class TestRadiusManagerResultCalculation:
    """Test calculating radius needed for desired results."""
    
    def test_calculate_radius_for_small_result_set(self):
        """Test radius calculation for small result count."""
        # Want 5 results
        radius = RadiusManager.calculate_search_radius_from_results(5)
        
        assert radius >= 3  # Minimum is 3km
        assert radius <= 20  # Maximum is 20km
        assert isinstance(radius, (int, float))
    
    def test_calculate_radius_for_large_result_set(self):
        """Test radius calculation for large result count."""
        # Want 50 results - should need bigger radius
        radius_50 = RadiusManager.calculate_search_radius_from_results(50)
        
        # Want 5 results - should need smaller radius
        radius_5 = RadiusManager.calculate_search_radius_from_results(5)
        
        assert radius_50 > radius_5
    
    def test_calculate_radius_zero_results(self):
        """Test radius calculation when requesting 0 results."""
        radius = RadiusManager.calculate_search_radius_from_results(0)
        
        # Should default to minimum
        assert radius == 3
    
    def test_calculate_radius_negative_results(self):
        """Test radius calculation with invalid negative count."""
        radius = RadiusManager.calculate_search_radius_from_results(-5)
        
        # Should default to minimum
        assert radius == 3
    
    def test_calculate_radius_maximum_constraint(self):
        """Test that calculated radius respects maximum limit."""
        # Request unreasonaly high result count
        radius = RadiusManager.calculate_search_radius_from_results(10000)
        
        # Should be capped at 20km
        assert radius <= 20
    
    def test_radius_calculation_monotonic(self):
        """Test that more results require larger radius."""
        result_counts = [1, 5, 10, 20, 50]
        radii = [RadiusManager.calculate_search_radius_from_results(rc) for rc in result_counts]
        
        # Each radius should be >= previous (monotonic)
        for i in range(len(radii) - 1):
            assert radii[i] <= radii[i + 1]


class TestRadiusManagerEdgeCases:
    """Test edge cases and boundary conditions."""
    
    def test_very_large_radius(self):
        """Test handling of very large radius values."""
        result = RadiusManager.auto_expand_radius(100.0, 1)
        new_radius, was_expanded = result
        
        # Should still work (150km is possible but very large)
        assert was_expanded is True
        assert new_radius > 0
    
    def test_very_small_radius(self):
        """Test handling of very small radius values."""
        # 0.1 km = 100 meters
        result = RadiusManager.auto_expand_radius(0.1, 1)
        new_radius, was_expanded = result
        
        assert was_expanded is True
        assert new_radius > 0.1
    
    def test_float_precision(self):
        """Test radius calculations with floating point values."""
        radius = 3.54321
        new_radius, was_expanded = RadiusManager.auto_expand_radius(radius, 1)
        
        # Should expand correctly with float values
        assert was_expanded is True
        assert abs(new_radius - (radius * 1.5)) < 0.0001
    
    def test_expansion_with_large_result_count(self):
        """Test that very large result count prevents expansion."""
        current_radius = 3.0
        
        new_radius, was_expanded = RadiusManager.auto_expand_radius(
            current_radius, 1000
        )
        
        assert was_expanded is False
        assert new_radius == current_radius


class TestRadiusManagerIntegration:
    """Integration tests combining multiple features."""
    
    def test_preset_to_expansion_workflow(self):
        """Test typical workflow: start with preset, expand if needed."""
        # User selects preset (3km)
        radius = RadiusManager.get_preset_radius(0)
        assert radius == 3
        
        # Search returns few results
        result_count = 2
        new_radius, was_expanded = RadiusManager.auto_expand_radius(radius, result_count)
        
        # Should automatically expand
        assert was_expanded is True
        assert new_radius > radius
    
    def test_multiple_searches_with_radius_progression(self):
        """Test simulated multiple searches with increasing radius."""
        radii_used = []
        result_counts = [2, 3, 4, 10]  # Progressive result counts
        
        current_radius = 3.0
        
        for result_count in result_counts:
            radii_used.append(current_radius)
            
            if result_count < 5:
                new_radius, _ = RadiusManager.auto_expand_radius(current_radius, result_count)
                current_radius = new_radius
        
        # Should have expanded at least once
        assert radii_used[-1] > radii_used[0]
    
    def test_available_radius_coverage(self):
        """Test that preset radii cover common search scenarios."""
        presets = RadiusManager.get_all_presets()
        
        # Should have at least 3 options
        assert len(presets) >= 3
        
        # All presets should be valid
        for preset in presets:
            assert RadiusManager.validate_radius(preset) is True
        
        # Should be in increasing order
        assert presets == sorted(presets)
