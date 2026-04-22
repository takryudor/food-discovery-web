// Mock data cho development - theo thiết kế ban đầu (Image #2)

import {
  FiltersOptionsResponse,
  SearchResponse,
  GeoJSONFeatureCollection,
  RestaurantSuggestion,
  RestaurantDetail,
} from "./types";

// ==================== FILTERS DATA ====================
// Theo thiết kế ban đầu (Image #2): Concept, Mục đích, Tiện ích + Budget ranges
export const MOCK_FILTERS: FiltersOptionsResponse = {
  concepts: [
    { id: 1, name: "healthyFood", slug: "healthy-food" },
    { id: 2, name: "specialty", slug: "specialty" },
    { id: 3, name: "fastFood", slug: "fast-food" },
    { id: 4, name: "vegetarian", slug: "vegetarian" },
  ],
  purposes: [
    { id: 1, name: "datingNight", slug: "dating-night" },
    { id: 2, name: "familyGathering", slug: "family-gathering" },
    { id: 3, name: "businessMeeting", slug: "business-meeting" },
    { id: 4, name: "casualHangout", slug: "casual-hangout" },
    { id: 5, name: "soloDining", slug: "solo-dining" },
  ],
  amenities: [
    { id: 1, name: "carParking", slug: "car-parking" },
    { id: 2, name: "petFriendly", slug: "pet-friendly" },
    { id: 3, name: "airConditioned", slug: "air-conditioned" },
    { id: 4, name: "digitalPayment", slug: "digital-payment" },
    { id: 5, name: "kidsCorner", slug: "kids-corner" },
  ],
  budget_ranges: [
    { id: 1, name: "under100k", slug: "duoi-100k" },
    { id: 2, name: "range100kTo200k", slug: "100k-200k" },
    { id: 3, name: "range200kTo500k", slug: "200k-500k" },
    { id: 4, name: "range500kTo1tr", slug: "500k-1tr" },
    { id: 5, name: "above1tr", slug: "tren-1tr" },
  ],
};

// ==================== RESTAURANTS DATA ====================
// 20 quán với tổ hợp đa dạng để mọi bộ lọc đều có ít nhất 1 kết quả
const RESTAURANTS_DATA = [
  // Row 1-5: Healthy food combinations
  {
    id: 1,
    name: "Green Garden Salad",
    description:
      "Salad tươi ngon, healthy mỗi ngày. Không gian thoáng mát, phù hợp cho những ai muốn ăn healthy mà vẫn ngon miệng.",
    address: "12 Lê Lợi, Q1, TP.HCM",
    phone: "+84 28 1234 5671",
    open_hours: "7:00 - 21:00 (T2-CN)",
    latitude: 10.775,
    longitude: 106.698,
    rating: 4.3,
    price_range: "80,000đ - 150,000đ",
    cover_image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",
    concept_ids: [1],
    purpose_ids: [1],
    amenity_ids: [1],
    budget_range_ids: [2],
  },
  {
    id: 2,
    name: "Organic Bowl",
    description:
      "Thực phẩm organic chuẩn Mỹ, nguồn gốc rõ ràng. Thực đơn đa dạng từ salad đến bowl đầy đủ dinh dưỡng.",
    address: "45 Nguyễn Huệ, Q1, TP.HCM",
    phone: "+84 28 1234 5672",
    open_hours: "8:00 - 22:00 (T2-CN)",
    latitude: 10.776,
    longitude: 106.7,
    rating: 4.5,
    price_range: "150,000đ - 250,000đ",
    cover_image:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
    concept_ids: [1],
    purpose_ids: [2],
    amenity_ids: [2],
    budget_range_ids: [3],
  },
  {
    id: 3,
    name: "Fresh Express",
    description:
      "Healthy food cho dân văn phòng. Giao hàng nhanh, đóng gói đẹp, giữ được độ tươi ngon.",
    address: "78 Hàm Nghi, Q1, TP.HCM",
    phone: "+84 28 1234 5673",
    open_hours: "7:00 - 20:00 (T2-T7)",
    latitude: 10.773,
    longitude: 106.702,
    rating: 4.2,
    price_range: "100,000đ - 180,000đ",
    cover_image:
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800",
    concept_ids: [1],
    purpose_ids: [3],
    amenity_ids: [3],
    budget_range_ids: [2],
  },
  {
    id: 4,
    name: "Healthy Bites",
    description:
      "Ăn healthy không khó! Menu phong phú từ smoothie bowls đến wraps healthy.",
    address: "23 Lý Tự Trọng, Q1, TP.HCM",
    phone: "+84 28 1234 5674",
    open_hours: "7:30 - 21:30 (T2-CN)",
    latitude: 10.774,
    longitude: 106.697,
    rating: 4.4,
    price_range: "90,000đ - 160,000đ",
    cover_image:
      "https://images.unsplash.com/photo-1490645935967-10de6ba25561?w=800",
    concept_ids: [1],
    purpose_ids: [4],
    amenity_ids: [4],
    budget_range_ids: [2],
  },
  {
    id: 5,
    name: "VitaGreen",
    description:
      "Món xanh cho người sống xanh. Thực đơn thay đổi theo mùa, sử dụng nguyên liệu địa phương.",
    address: "56 Đồng Khởi, Q1, TP.HCM",
    phone: "+84 28 1234 5675",
    open_hours: "6:30 - 21:00 (T2-CN)",
    latitude: 10.778,
    longitude: 106.705,
    rating: 4.1,
    price_range: "50,000đ - 100,000đ",
    cover_image:
      "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800",
    concept_ids: [1],
    purpose_ids: [5],
    amenity_ids: [5],
    budget_range_ids: [1],
  },

  // Row 6-9: Specialty combinations
  {
    id: 6,
    name: "Gourmet Corner",
    description:
      "Ẩm thực đặc sắc các vùng miền Việt Nam. Đầu bếp có kinh nghiệm, trình bày đẹp mắt.",
    address: "89 Pasteur, Q1, TP.HCM",
    phone: "+84 28 1234 5676",
    open_hours: "10:00 - 22:00 (T2-CN)",
    latitude: 10.779,
    longitude: 106.703,
    rating: 4.6,
    price_range: "500,000đ - 800,000đ",
    cover_image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
    concept_ids: [2],
    purpose_ids: [1],
    amenity_ids: [1],
    budget_range_ids: [4],
  },
  {
    id: 7,
    name: "Chef's Table",
    description:
      "Trải nghiệm ẩm thực đỉnh cao với set menu 7 món. Cần đặt bàn trước.",
    address: "34 Tôn Đức Thắng, Q1, TP.HCM",
    phone: "+84 28 1234 5677",
    open_hours: "18:00 - 23:00 (T3-CN)",
    latitude: 10.78,
    longitude: 106.71,
    rating: 4.7,
    price_range: "1,500,000đ - 3,000,000đ",
    cover_image:
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800",
    concept_ids: [2],
    purpose_ids: [3],
    amenity_ids: [3],
    budget_range_ids: [5],
  },
  {
    id: 8,
    name: "Signature Bistro",
    description:
      "Món đặc trưng chỉ có ở đây. Không gian ấm cúng, phục vụ chuyên nghiệp.",
    address: "67 Lê Thánh Tôn, Q1, TP.HCM",
    phone: "+84 28 1234 5678",
    open_hours: "11:00 - 23:00 (T2-CN)",
    latitude: 10.775,
    longitude: 106.702,
    rating: 4.5,
    price_range: "400,000đ - 700,000đ",
    cover_image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
    concept_ids: [2],
    purpose_ids: [2],
    amenity_ids: [2],
    budget_range_ids: [4],
  },
  {
    id: 9,
    name: "Deluxe Dining",
    description: "Fine dining giá hợp lý. Menu fusion Âu-Á độc đáo.",
    address: "91 Nam Kỳ Khởi Nghĩa, Q1, TP.HCM",
    phone: "+84 28 1234 5679",
    open_hours: "11:30 - 22:00 (T2-CN)",
    latitude: 10.77,
    longitude: 106.704,
    rating: 4.4,
    price_range: "300,000đ - 500,000đ",
    cover_image:
      "https://images.unsplash.com/photo-1550966871-3ed3c47e2ce2?w=800",
    concept_ids: [2],
    purpose_ids: [5],
    amenity_ids: [5],
    budget_range_ids: [3],
  },

  // Row 10-13: Fast food combinations
  {
    id: 10,
    name: "Quick Bites",
    description: "Fast food nhanh gọn lẹ. Burger và fries theo phong cách Mỹ.",
    address: "123 Nguyễn Trãi, Q1, TP.HCM",
    phone: "+84 28 1234 5680",
    open_hours: "9:00 - 23:00 (T2-CN)",
    latitude: 10.772,
    longitude: 106.698,
    rating: 4.0,
    price_range: "60,000đ - 120,000đ",
    cover_image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
    concept_ids: [3],
    purpose_ids: [4],
    amenity_ids: [4],
    budget_range_ids: [1],
  },
  {
    id: 11,
    name: "Speedy Burger",
    description: "Burger ngon giá rẻ. Bánh tươi làm tại chỗ, thịt 100% bò Mỹ.",
    address: "45 Võ Văn Tần, Q3, TP.HCM",
    phone: "+84 28 1234 5681",
    open_hours: "10:00 - 22:00 (T2-CN)",
    latitude: 10.773,
    longitude: 106.689,
    rating: 4.1,
    price_range: "70,000đ - 140,000đ",
    cover_image:
      "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800",
    concept_ids: [3],
    purpose_ids: [5],
    amenity_ids: [1],
    budget_range_ids: [1],
  },
  {
    id: 12,
    name: "Fast & Fresh",
    description: "Fast food nhưng tươi mới. Không dùng đồ đông lạnh.",
    address: "78 Cách Mạng Tháng 8, Q1, TP.HCM",
    phone: "+84 28 1234 5682",
    open_hours: "9:00 - 22:00 (T2-CN)",
    latitude: 10.776,
    longitude: 106.695,
    rating: 4.2,
    price_range: "80,000đ - 150,000đ",
    cover_image:
      "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800",
    concept_ids: [3],
    purpose_ids: [2],
    amenity_ids: [5],
    budget_range_ids: [2],
  },
  {
    id: 13,
    name: "Grab & Go",
    description: "Mua mang đi nhanh chóng. Phù hợp cho người bận rộn.",
    address: "156 Hai Bà Trưng, Q1, TP.HCM",
    phone: "+84 28 1234 5683",
    open_hours: "7:00 - 21:00 (T2-CN)",
    latitude: 10.774,
    longitude: 106.703,
    rating: 4.0,
    price_range: "50,000đ - 100,000đ",
    cover_image:
      "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800",
    concept_ids: [3],
    purpose_ids: [3],
    amenity_ids: [2],
    budget_range_ids: [1],
  },

  // Row 14-17: Vegetarian combinations
  {
    id: 14,
    name: "Vegan Delight",
    description:
      "Món chay ngon nhất thành phố. Đa dạng từ món Việt đến món quốc tế.",
    address: "189 Bến Vân Đồn, Q4, TP.HCM",
    phone: "+84 28 1234 5684",
    open_hours: "7:00 - 21:00 (T2-CN)",
    latitude: 10.759,
    longitude: 106.695,
    rating: 4.5,
    price_range: "80,000đ - 150,000đ",
    cover_image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",
    concept_ids: [4],
    purpose_ids: [2],
    amenity_ids: [3],
    budget_range_ids: [2],
  },
  {
    id: 15,
    name: "Green Lotus",
    description: "Ẩm thực chay thanh tịnh. Không gian yên bình, nhẹ nhàng.",
    address: "234 Lê Lai, Q1, TP.HCM",
    phone: "+84 28 1234 5685",
    open_hours: "6:30 - 20:30 (T2-CN)",
    latitude: 10.769,
    longitude: 106.699,
    rating: 4.6,
    price_range: "150,000đ - 250,000đ",
    cover_image:
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800",
    concept_ids: [4],
    purpose_ids: [1],
    amenity_ids: [1],
    budget_range_ids: [3],
  },
  {
    id: 16,
    name: "Pure Veggie",
    description: "100% thực vật, 100% ngon. Menu sáng tạo, trình bày đẹp mắt.",
    address: "67 Lý Tự Trọng, Q1, TP.HCM",
    phone: "+84 28 1234 5686",
    open_hours: "8:00 - 22:00 (T2-CN)",
    latitude: 10.774,
    longitude: 106.697,
    rating: 4.3,
    price_range: "100,000đ - 180,000đ",
    cover_image:
      "https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=800",
    concept_ids: [4],
    purpose_ids: [4],
    amenity_ids: [4],
    budget_range_ids: [2],
  },
  {
    id: 17,
    name: "Zen Garden",
    description: "Ăn chay tĩnh tâm. Phù hợp cho những buổi tiệc chay gia đình.",
    address: "89 Nguyễn Huệ, Q1, TP.HCM",
    phone: "+84 28 1234 5687",
    open_hours: "7:00 - 20:00 (T2-CN)",
    latitude: 10.776,
    longitude: 106.7,
    rating: 4.4,
    price_range: "60,000đ - 120,000đ",
    cover_image:
      "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800",
    concept_ids: [4],
    purpose_ids: [5],
    amenity_ids: [2],
    budget_range_ids: [1],
  },

  // Row 18-20: Mixed combinations để cover thêm
  {
    id: 18,
    name: "Fusion Kitchen",
    description:
      "Healthy + Specialty mix. Món ăn kết hợp giữa healthy và đặc sắc.",
    address: "45 Pasteur, Q1, TP.HCM",
    phone: "+84 28 1234 5688",
    open_hours: "10:00 - 22:00 (T2-CN)",
    latitude: 10.779,
    longitude: 106.703,
    rating: 4.5,
    price_range: "200,000đ - 400,000đ",
    cover_image:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
    concept_ids: [1, 2],
    purpose_ids: [3, 4],
    amenity_ids: [3, 4],
    budget_range_ids: [3],
  },
  {
    id: 19,
    name: "Family Feast",
    description:
      "Fast food cho cả nhà. Không gian rộng rãi, có khu vui chơi trẻ em.",
    address: "12 Nam Kỳ Khởi Nghĩa, Q1, TP.HCM",
    phone: "+84 28 1234 5689",
    open_hours: "9:00 - 22:00 (T2-CN)",
    latitude: 10.77,
    longitude: 106.704,
    rating: 4.2,
    price_range: "120,000đ - 250,000đ",
    cover_image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
    concept_ids: [3],
    purpose_ids: [2],
    amenity_ids: [5, 1],
    budget_range_ids: [2],
  },
  {
    id: 20,
    name: "Date Night Spot",
    description: "Lãng mạn cho buổi hẹn. Ánh nến, nhạc nhẹ, view đẹp.",
    address: "78 Đồng Khởi, Q1, TP.HCM",
    phone: "+84 28 1234 5690",
    open_hours: "17:00 - 23:00 (T2-CN)",
    latitude: 10.778,
    longitude: 106.705,
    rating: 4.7,
    price_range: "500,000đ - 1,000,000đ",
    cover_image:
      "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800",
    concept_ids: [2, 4],
    purpose_ids: [1],
    amenity_ids: [2, 3],
    budget_range_ids: [4],
  },
];

// Tạo SearchResponse từ RESTAURANTS_DATA
export const MOCK_RESTAURANTS: SearchResponse = {
  items: RESTAURANTS_DATA.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    address: r.address,
    latitude: r.latitude,
    longitude: r.longitude,
    rating: r.rating,
    match_score: Math.random() * 0.3 + 0.7, // Random score từ 0.7 - 1.0
  })),
  total: RESTAURANTS_DATA.length,
  limit: 20,
  offset: 0,
};

// ==================== MAP MARKERS ====================
export const MOCK_MARKERS: GeoJSONFeatureCollection = {
  type: "FeatureCollection",
  features: RESTAURANTS_DATA.map((r) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [r.longitude, r.latitude],
    },
    properties: {
      id: r.id,
      name: r.name,
      address: r.address,
    },
  })),
};

// ==================== AUTOCOMPLETE SUGGESTIONS ====================
export const MOCK_SUGGESTIONS: RestaurantSuggestion[] = RESTAURANTS_DATA.map(
  (r) => ({
    id: r.id,
    name: r.name,
    address: r.address,
  }),
);

// ==================== HELPER FUNCTIONS ====================

// Lọc restaurants theo filters
export function filterRestaurants(
  conceptIds?: number[],
  purposeIds?: number[],
  amenityIds?: number[],
  budgetRangeIds?: number[],
  query?: string,
) {
  let filtered = [...RESTAURANTS_DATA];

  if (conceptIds && conceptIds.length > 0) {
    filtered = filtered.filter((r) =>
      r.concept_ids.some((id) => conceptIds.includes(id)),
    );
  }

  if (purposeIds && purposeIds.length > 0) {
    filtered = filtered.filter((r) =>
      r.purpose_ids.some((id) => purposeIds.includes(id)),
    );
  }

  if (amenityIds && amenityIds.length > 0) {
    filtered = filtered.filter((r) =>
      r.amenity_ids.some((id) => amenityIds.includes(id)),
    );
  }

  // Lọc theo khoảng ngân sách
  if (budgetRangeIds && budgetRangeIds.length > 0) {
    filtered = filtered.filter(
      (r) =>
        r.budget_range_ids &&
        r.budget_range_ids.some((id) => budgetRangeIds.includes(id)),
    );
  }

  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    filtered = filtered.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q),
    );
  }

  return {
    items: filtered.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      address: r.address,
      latitude: r.latitude,
      longitude: r.longitude,
      rating: r.rating,
      match_score: Math.random() * 0.3 + 0.7,
    })),
    total: filtered.length,
    limit: 20,
    offset: 0,
  };
}

// Lấy markers theo restaurant IDs
export function getMarkersByIds(ids: number[]): GeoJSONFeatureCollection {
  const filtered = RESTAURANTS_DATA.filter((r) => ids.includes(r.id));
  return {
    type: "FeatureCollection",
    features: filtered.map((r) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [r.longitude, r.latitude],
      },
      properties: {
        id: r.id,
        name: r.name,
        address: r.address,
      },
    })),
  };
}

// Tìm kiếm fulltext
export function searchFulltext(
  query: string,
  limit: number = 8,
): RestaurantSuggestion[] {
  const q = query.toLowerCase().trim();
  const results = RESTAURANTS_DATA.filter(
    (r) =>
      r.name.toLowerCase().includes(q) || r.address.toLowerCase().includes(q),
  ).slice(0, limit);

  return results.map((r) => ({
    id: r.id,
    name: r.name,
    address: r.address,
  }));
}

// Lấy chi tiết restaurant
export function getMockRestaurantDetail(
  id: number,
): RestaurantDetail | undefined {
  const r = RESTAURANTS_DATA.find((r) => r.id === id);
  if (!r) return undefined;

  // Map mock tag IDs to mock tag objects
  const getConcepts = (ids: number[]) =>
    MOCK_FILTERS.concepts.filter((c) => ids.includes(c.id));
  const getPurposes = (ids: number[]) =>
    MOCK_FILTERS.purposes.filter((p) => ids.includes(p.id));
  const getAmenities = (ids: number[]) =>
    MOCK_FILTERS.amenities.filter((a) => ids.includes(a.id));

  return {
    id: r.id,
    name: r.name,
    description: r.description,
    address: r.address,
    latitude: r.latitude,
    longitude: r.longitude,
    rating: r.rating,
    phone: r.phone,
    open_hours: r.open_hours,
    price_range: r.price_range,
    cover_image: r.cover_image,
    concepts: getConcepts(r.concept_ids),
    purposes: getPurposes(r.purpose_ids),
    amenities: getAmenities(r.amenity_ids),
  };
}
