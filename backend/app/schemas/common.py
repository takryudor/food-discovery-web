from pydantic import BaseModel


class IdName(BaseModel):
	"""
	Common small schema returned for filter options (concept/purpose/amenity).
	"""

	id: int
	name: str
	slug: str | None = None

