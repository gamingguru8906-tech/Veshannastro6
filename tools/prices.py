"""The 2027 report prices and the offer: the one place to change them.

Used by build_report.py (the report page, and api/r27/_catalog.json, which the payment server charges from)
and by build_blog.py (the report boxes on every blog post). After a change, run build_report.py, then build_blog.py.
"""

# Prices after the 30% Diwali offer, and the original price shown struck through.
REPORTS = {
    "blend": {"name": "Astro-Numero Blend", "inr": 599, "inr_mrp": 856, "usd": 30, "usd_mrp": 43, "needs_time": True,
              "line": "12 parameters, including Transit, Varshaphal and Dasha. Needs your time of birth.",
              "pb": "Your year measured through 12 unique parameters."},
    "classic": {"name": "Classics", "inr": 499, "inr_mrp": 713, "usd": 20, "usd_mrp": 29, "needs_time": False,
                "line": "10 parameters, built around your action plan and remedies. No birth time needed.",
                "pb": "Your year measured through 10 unique parameters."},
}
OFFER = {"pct": 30, "name": "Diwali offer", "starts": "2026-10-24", "ends": "2026-11-10", "ends_text": "10 November", "limit": 50}


def from_inr():
    """Lowest report price in rupees, for "from ₹..." lines."""
    return min(r["inr"] for r in REPORTS.values())
