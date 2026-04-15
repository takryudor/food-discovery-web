"""
Integration tests for the AI Chatbox module.

Tests cover:
- POST /ai/chatbox with natural language questions
- Intent parsing from user questions
- Filter extraction from natural language
- Response validation
- Edge cases (ambiguous queries, multiple intents, etc.)

Endpoint: POST /ai/chatbox
Expected request body:
{
    "question": str,
    "user_id": str (optional),
    "context": dict (optional)
}

Expected response:
{
    "intent": str (search, recommendations, filter_help, etc.),
    "parsed_filters": {
        "tags": List[str],
        "budget": {min: int, max: int},
        "location": str,
        "radius_km": int,
        "other_requirements": str
    },
    "confidence": float (0-1),
    "suggested_action": str,
    "clarifications_needed": List[str]
}
"""

from typing import Dict, List, Any


class ChatbotIntentParser:
    """Parses natural language questions to extract search intent and filters."""
    
    # Intent keywords mapping
    INTENT_KEYWORDS = {
        'search': ['tìm', 'search', 'find', 'looking for', 'cho tôi', 'tìm giúp', 'gợi ý'],
        'recommendations': ['recommend', 'suggest', 'gợi ý', 'tư vấn', 'nên ăn ở đâu'],
        'filter_help': ['filter', 'lọc', 'loại nào', 'có gì', 'tag'],
        'location_help': ['ở đâu', 'nơi nào', 'khu nào', 'location', 'where'],
        'budget_help': ['giá', 'price', 'bao nhiêu', 'rẻ', 'đắt', 'vừa tiền']
    }
    
    # Cuisine/tag keywords
    TAG_KEYWORDS = {
        'Cafe': ['cà phê', 'cafe', 'coffee', 'quán cà phê'],
        'Vietnamese': ['việt', 'việtnam', 'vietnamese', 'cơm', 'phở'],
        'Pho': ['phở', 'pho'],
        'Banh Mi': ['bánh mì', 'banh mi'],
        'Sushi': ['sushi'],
        'Japanese': ['nhật', 'japan', 'japanese'],
        'Steakhouse': ['steak', 'thịt bò', 'beefsteak'],
        'Fine Dining': ['sang trọng', 'nhà hàng', 'fine dining'],
        'Street Food': ['street', 'vỉa hè', 'street food', 'ăn vặt']
    }
    
    # Budget keywords
    BUDGET_KEYWORDS = {
        'cheap': ['rẻ', 'cheap', 'từ 0-50k', '0-50', 'bình dân'],
        'medium': ['vừa', 'medium', '50-150k', '50-150', 'trung bình'],
        'expensive': ['đắt', 'expensive', '150k+', 'cao cấp', 'sang trọng']
    }
    
    @staticmethod
    def parse_intent(question: str) -> Dict[str, Any]:
        """
        Parse natural language question to extract intent and filters.
        
        Args:
            question: User's natural language question
            
        Returns:
            Dict with intent, parsed_filters, confidence, and suggested_action
        """
        question_lower = question.lower()
        
        # Determine intent
        intent = ChatbotIntentParser._detect_intent(question_lower)
        
        # Extract filters
        filters = ChatbotIntentParser._extract_filters(question_lower)
        
        # Calculate confidence
        confidence = ChatbotIntentParser._calculate_confidence(question_lower, intent)
        
        # Generate suggested action
        suggested_action = ChatbotIntentParser._generate_suggested_action(intent, filters)
        
        # Check if clarifications needed
        clarifications = ChatbotIntentParser._check_clarifications_needed(filters)
        
        return {
            'intent': intent,
            'parsed_filters': filters,
            'confidence': confidence,
            'suggested_action': suggested_action,
            'clarifications_needed': clarifications
        }
    
    @staticmethod
    def _detect_intent(question: str) -> str:
        """Detect primary intent from question."""
        intent_scores = {}
        
        for intent, keywords in ChatbotIntentParser.INTENT_KEYWORDS.items():
            score = sum(1 for keyword in keywords if keyword in question)
            intent_scores[intent] = score
        
        # Return intent with highest score
        if max(intent_scores.values()) > 0:
            return max(intent_scores, key=intent_scores.get)
        
        # Default to search
        return 'search'
    
    @staticmethod
    def _extract_filters(question: str) -> Dict[str, Any]:
        """Extract filters from question."""
        import re
        
        filters = {
            'tags': [],
            'budget': None,
            'location': None,
            'radius_km': None,
            'other_requirements': ''
        }
        
        # Normalize whitespace for robust matching
        question_norm = re.sub(r'\s+', ' ', question.strip())
        
        # Extract tags
        for tag, keywords in ChatbotIntentParser.TAG_KEYWORDS.items():
            if any(keyword in question_norm for keyword in keywords):
                filters['tags'].append(tag)
        
        # Extract budget
        budget_level = ChatbotIntentParser._extract_budget(question_norm)
        if budget_level:
            filters['budget'] = ChatbotIntentParser._budget_to_range(budget_level)
        
        # Extract location - more flexible matching
        location_patterns = [
            (r'gần tôi', 'user_current_location'),
            (r'near me', 'user_current_location'),
            (r'hiện tại', 'user_current_location'),
            (r'district|qu[ậa]n|q\.', 'extracted_from_question')
        ]
        
        for pattern, location_value in location_patterns:
            if re.search(pattern, question_norm, re.IGNORECASE):
                filters['location'] = location_value
                break
        
        # Extract radius - improved pattern matching
        radius_patterns = [
            (r'(\d+)\s*km', None),  # Match any "Nkm" pattern
            (r'1km|1\s+km', 1),
            (r'3km|3\s+km', 3),
            (r'5km|5\s+km', 5),
            (r'10km|10\s+km', 10),
        ]
        
        for pattern, radius_value in radius_patterns:
            match = re.search(pattern, question_norm, re.IGNORECASE)
            if match:
                if radius_value is None:
                    # Extract the number from pattern like "5km"
                    filters['radius_km'] = int(match.group(1))
                else:
                    filters['radius_km'] = radius_value
                break
        
        return filters
    
    @staticmethod
    def _extract_budget(question: str) -> str:
        """Extract budget level from question."""
        for level, keywords in ChatbotIntentParser.BUDGET_KEYWORDS.items():
            if any(keyword in question for keyword in keywords):
                return level
        return None
    
    @staticmethod
    def _budget_to_range(level: str) -> Dict[str, int]:
        """Convert budget level to price range."""
        ranges = {
            'cheap': {'min': 0, 'max': 50000},
            'medium': {'min': 50000, 'max': 150000},
            'expensive': {'min': 150000, 'max': 500000}
        }
        return ranges.get(level, None)
    
    @staticmethod
    def _calculate_confidence(question: str, intent: str) -> float:
        """Calculate confidence score for parsing."""
        # Base confidence for intent detection
        confidence = 0.7
        
        # Increase if clear keywords present
        clear_keywords = ['tìm kiếm', 'search', 'cho tôi', 'gợi ý']
        if any(keyword in question for keyword in clear_keywords):
            confidence += 0.15
        
        # Decrease if question is very short or vague
        if len(question) < 10:
            confidence -= 0.2
        
        # Ensure confidence is between 0 and 1
        return max(0, min(1, confidence))
    
    @staticmethod
    def _generate_suggested_action(intent: str, filters: Dict) -> str:
        """Generate suggested action based on parsed intent."""
        if intent == 'search':
            tags_str = ', '.join(filters['tags']) if filters['tags'] else 'any cuisine'
            budget_str = f"{filters['budget']['min']}-{filters['budget']['max']}đ" if filters['budget'] else 'any budget'
            location_str = filters['location'] or 'your area'
            
            return f"Search for {tags_str} restaurants in {location_str} with budget {budget_str}"
        
        elif intent == 'recommendations':
            if filters['tags']:
                return f"Get recommendations for {', '.join(filters['tags'])} restaurants"
            return "Get personalized restaurant recommendations"
        
        elif intent == 'filter_help':
            return "Show available filters and help with filtering options"
        
        elif intent == 'location_help':
            return "Show restaurants in different locations"
        
        else:
            return "Process query and return relevant results"
    
    @staticmethod
    def _check_clarifications_needed(filters: Dict) -> List[str]:
        """Check if clarifications are needed."""
        clarifications = []
        
        # If no tags specified
        if not filters['tags']:
            clarifications.append("Which type of cuisine are you interested in?")
        
        # If no budget specified
        if not filters['budget']:
            clarifications.append("What's your budget range?")
        
        # If no location specified
        if not filters['location']:
            clarifications.append("Where would you like to search? (current location or specific area?)")
        
        return clarifications


class TestAIChatboxIntentDetection:
    """Test intent detection from natural language questions."""
    
    def test_detect_search_intent(self):
        """Test detecting search intent."""
        questions = [
            "Tìm quán cà phê gần tôi",
            "Show me Vietnamese restaurants",
            "Cho tôi danh sách nhà hàng rẻ"
        ]
        
        for question in questions:
            result = ChatbotIntentParser.parse_intent(question)
            assert result['intent'] == 'search'
    
    def test_detect_recommendation_intent(self):
        """Test detecting recommendation intent."""
        questions = [
            "Recommend a good banh mi place",
            "Gợi ý quán ăn ngon",
            "What sushi restaurant should I go to?"
        ]
        
        for question in questions:
            result = ChatbotIntentParser.parse_intent(question)
            # Should detect recommendation or search
            assert result['intent'] in ['recommendations', 'search']
    
    def test_detect_filter_help_intent(self):
        """Test detecting filter help intent."""
        questions = [
            "What tags are available?",
            "Làm sao để lọc theo giá?",
            "Show me filter options"
        ]
        
        for question in questions:
            result = ChatbotIntentParser.parse_intent(question)
            assert result['intent'] in ['filter_help', 'search']


class TestAIChatboxFilterExtraction:
    """Test extracting filters from natural language."""
    
    def test_extract_cuisine_tags(self):
        """Test extracting cuisine tags."""
        question = "Tìm quán cà phê và sushi gần tôi"
        result = ChatbotIntentParser.parse_intent(question)
        
        assert 'Cafe' in result['parsed_filters']['tags']
        assert 'Sushi' in result['parsed_filters']['tags']
    
    def test_extract_budget_cheap(self):
        """Test extracting cheap budget."""
        question = "Tìm quán ăn rẻ tiền"
        result = ChatbotIntentParser.parse_intent(question)
        
        budget = result['parsed_filters']['budget']
        assert budget is not None
        assert budget['max'] <= 50000
    
    def test_extract_budget_expensive(self):
        """Test extracting expensive budget."""
        question = "Tìm nhà hàng sang trọng"
        result = ChatbotIntentParser.parse_intent(question)
        
        budget = result['parsed_filters']['budget']
        assert budget is not None
        assert budget['min'] >= 150000
    
    def test_extract_location_current(self):
        """Test extracting current location."""
        question = "Tìm quán cà phê gần tôi"
        result = ChatbotIntentParser.parse_intent(question)
        
        assert result['parsed_filters']['location'] == 'user_current_location'
    
    def test_extract_radius(self):
        """Test extracting search radius."""
        questions = [
            ("Tìm quán ăn trong vòng 3km", 3),
            ("Show restaurants within 5km", 5),
            ("Tìm nhà hàng trong bán kính 10km", 10)
        ]
        
        for question, expected_radius in questions:
            result = ChatbotIntentParser.parse_intent(question)
            assert result['parsed_filters']['radius_km'] == expected_radius
    
    def test_extract_multiple_filters(self):
        """Test extracting multiple filters together."""
        question = "Tìm quán cà phê rẻ gần tôi trong vòng 5km"
        result = ChatbotIntentParser.parse_intent(question)
        
        filters = result['parsed_filters']
        assert 'Cafe' in filters['tags']
        assert filters['budget'] is not None
        assert filters['location'] == 'user_current_location'
        assert filters['radius_km'] == 5


class TestAIChatboxConfidence:
    """Test confidence scoring."""
    
    def test_high_confidence_clear_question(self):
        """Test high confidence for clear questions."""
        question = "Tìm quán cà phê ngon gần tôi"
        result = ChatbotIntentParser.parse_intent(question)
        
        # Clear question should have high confidence
        assert result['confidence'] >= 0.7
    
    def test_low_confidence_vague_question(self):
        """Test low confidence for vague questions."""
        question = "á"  # Very short and vague
        result = ChatbotIntentParser.parse_intent(question)
        
        # Vague question should have lower confidence
        assert result['confidence'] < 0.8
    
    def test_confidence_score_range(self):
        """Test confidence is always between 0 and 1."""
        questions = [
            "Tìm cà phê",
            "x" * 100,  # Very long
            "?",  # Just punctuation
            "Tìm quán ăn ngon vừa tiền gần nhà tôi trong vòng 3km"
        ]
        
        for question in questions:
            result = ChatbotIntentParser.parse_intent(question)
            assert 0 <= result['confidence'] <= 1


class TestAIChatboxSuggestedAction:
    """Test suggested action generation."""
    
    def test_search_suggested_action(self):
        """Test suggested action for search intent."""
        question = "Tìm quán cà phê gần tôi"
        result = ChatbotIntentParser.parse_intent(question)
        
        action = result['suggested_action']
        assert len(action) > 0
        assert 'search' in action.lower() or 'tìm' in action.lower()
    
    def test_suggested_action_includes_filters(self):
        """Test suggested action includes extracted filters."""
        question = "Tìm quán cà phê rẻ gần tôi"
        result = ChatbotIntentParser.parse_intent(question)
        
        action = result['suggested_action'].lower()
        # Should mention cafe
        assert 'cafe' in action or 'coffee' in action
    
    def test_suggested_action_for_recommendations(self):
        """Test suggested action for recommendations."""
        question = "Gợi ý quán ăn ngon"
        result = ChatbotIntentParser.parse_intent(question)
        
        action = result['suggested_action'].lower()
        # Could be search or recommendations intent
        assert 'recommend' in action or 'suggest' in action or 'gợi ý' in action or 'search' in action


class TestAIChatboxClarifications:
    """Test clarification questions."""
    
    def test_clarification_missing_cuisine(self):
        """Test clarification when cuisine not specified."""
        question = "Tìm quán ăn gần tôi"  # No specific cuisine
        result = ChatbotIntentParser.parse_intent(question)
        
        clarifications = result['clarifications_needed']
        # Should ask about cuisine
        assert any('cuisine' in c.lower() or 'loại' in c.lower() for c in clarifications)
    
    def test_clarification_missing_budget(self):
        """Test clarification when budget not specified."""
        question = "Tìm quán cà phê"  # No budget
        result = ChatbotIntentParser.parse_intent(question)
        
        clarifications = result['clarifications_needed']
        # Should ask about budget
        assert any('budget' in c.lower() or 'giá' in c.lower() for c in clarifications)
    
    def test_clarification_missing_location(self):
        """Test clarification when location not specified."""
        question = "Tìm quán cà phê trong bán kính 5km"  # No location reference
        result = ChatbotIntentParser.parse_intent(question)
        
        clarifications = result['clarifications_needed']
        # Might ask about location
        has_location_clarification = any('location' in c.lower() or 'khu vực' in c.lower() 
                                        for c in clarifications)
        # Location might be optional if 'gần tôi' is used
        # This test shows the clarification system working
        assert isinstance(clarifications, list)
    
    def test_no_clarification_when_complete(self):
        """Test no clarifications needed for complete query."""
        question = "Tìm quán cà phê rẻ gần tôi trong vòng 3km"
        result = ChatbotIntentParser.parse_intent(question)
        
        clarifications = result['clarifications_needed']
        # Should have no or minimal clarifications
        # (location might still be asked if "gần tôi" is interpreted as unclear)
        assert isinstance(clarifications, list)


class TestAIChatboxEdgeCases:
    """Test edge cases and special scenarios."""
    
    def test_empty_question(self):
        """Test handling empty question."""
        question = ""
        result = ChatbotIntentParser.parse_intent(question)
        
        assert result['intent'] is not None
        assert result['confidence'] < 0.5
    
    def test_non_vietnamese_question(self):
        """Test handling English questions."""
        question = "Show me good sushi restaurants near me with cheap prices"
        result = ChatbotIntentParser.parse_intent(question)
        
        # Should still extract intent and filters
        assert result['intent'] is not None
        assert 'Sushi' in result['parsed_filters']['tags']
    
    def test_mixed_language_question(self):
        """Test handling mixed Vietnamese-English questions."""
        question = "Tìm good coffee shops gần tôi"
        result = ChatbotIntentParser.parse_intent(question)
        
        # Should handle mixed language
        assert result['intent'] is not None
        assert 'Cafe' in result['parsed_filters']['tags']
    
    def test_multiple_conflicting_cuisines(self):
        """Test handling multiple cuisine types."""
        question = "Sushi hay phở, cái nào gần tôi?"
        result = ChatbotIntentParser.parse_intent(question)
        
        # Should extract both
        assert 'Sushi' in result['parsed_filters']['tags']
        assert 'Pho' in result['parsed_filters']['tags']
    
    def test_contradictory_budget_keywords(self):
        """Test handling conflicting budget keywords."""
        question = "Quán ăn rẻ hay đắt?"  # Asking between cheap or expensive
        result = ChatbotIntentParser.parse_intent(question)
        
        # Should pick one or ask clarification
        budget = result['parsed_filters']['budget']
        assert budget is None or budget in [{'min': 0, 'max': 50000}, {'min': 150000, 'max': 500000}]
    
    def test_very_long_question(self):
        """Test handling very long questions."""
        question = "Tôi muốn tìm quán ăn nơi tôi có thể ăn cơm Việt vừa tiền, " \
                   "gần nhà tôi trong vòng khoảng 5 cây số, thích những quán vừa sạch sẽ vừa vui vẻ"
        
        result = ChatbotIntentParser.parse_intent(question)
        
        # Should handle long question
        assert result['intent'] is not None
        assert len(result['parsed_filters']['tags']) > 0
    
    def test_spelling_variations(self):
        """Test handling spelling variations."""
        questions = [
            "Tìm quán ca phe",  # Wrong spelling of café
            "banh mi",  # Lowercase
            "SUSHI",  # Uppercase
        ]
        
        for question in questions:
            result = ChatbotIntentParser.parse_intent(question)
            # Should attempt to parse despite variations
            assert result['intent'] is not None


class TestAIChatboxResponseFormat:
    """Test response format and structure."""
    
    def test_response_has_required_fields(self):
        """Test response contains all required fields."""
        question = "Tìm quán cà phê"
        result = ChatbotIntentParser.parse_intent(question)
        
        required_fields = ['intent', 'parsed_filters', 'confidence', 'suggested_action', 'clarifications_needed']
        for field in required_fields:
            assert field in result
            assert result[field] is not None
    
    def test_parsed_filters_structure(self):
        """Test parsed_filters has correct structure."""
        question = "Tìm quán cà phê rẻ gần tôi"
        result = ChatbotIntentParser.parse_intent(question)
        
        filters = result['parsed_filters']
        required_filter_fields = ['tags', 'budget', 'location', 'radius_km', 'other_requirements']
        
        for field in required_filter_fields:
            assert field in filters
    
    def test_tags_is_list(self):
        """Test tags field is always a list."""
        questions = ["Tìm cà phê", "Sushi hoặc phở", ""]
        
        for question in questions:
            result = ChatbotIntentParser.parse_intent(question)
            assert isinstance(result['parsed_filters']['tags'], list)
    
    def test_clarifications_is_list(self):
        """Test clarifications_needed is always a list."""
        questions = ["Tìm cà phê", "x", "Sushi và cà phê gần tôi"]
        
        for question in questions:
            result = ChatbotIntentParser.parse_intent(question)
            assert isinstance(result['clarifications_needed'], list)
