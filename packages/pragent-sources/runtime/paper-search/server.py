"""Compliance-scoped MCP facade for paper discovery."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from mcp.server.fastmcp import FastMCP
from paper_search_mcp.server import search_papers as upstream_search_papers


PACKAGE_ROOT = Path(__file__).resolve().parents[2]
POLICY = json.loads((PACKAGE_ROOT / "policy.json").read_text(encoding="utf-8"))
SEARCH_POLICY = POLICY["paperSearch"]
ALLOWED_SOURCES = tuple(SEARCH_POLICY["allowedSources"])
DEFAULT_SOURCES = tuple(SEARCH_POLICY["defaultSources"])
MAX_RESULTS_PER_SOURCE = int(SEARCH_POLICY["maxResultsPerSource"])

server = FastMCP("CyberEinstein Paper Discovery")


def _normalize_sources(raw_sources: str) -> list[str]:
    requested = raw_sources.strip().lower()
    if not requested or requested == "default":
        return list(DEFAULT_SOURCES)
    if requested == "all":
        return list(ALLOWED_SOURCES)

    sources = list(
        dict.fromkeys(part.strip() for part in requested.split(",") if part.strip())
    )
    if not sources:
        raise ValueError("sources must contain at least one approved source")
    unsupported = sorted(set(sources) - set(ALLOWED_SOURCES))
    if unsupported:
        raise ValueError(
            "Unsupported paper source(s): "
            + ", ".join(unsupported)
            + ". Allowed sources: "
            + ", ".join(ALLOWED_SOURCES)
        )
    return sources


@server.tool()
async def discover_papers(
    query: str,
    sources: str = "default",
    max_results_per_source: int = 5,
    year: str | None = None,
) -> dict[str, Any]:
    """Discover paper metadata from approved scholarly sources.

    This capability is discovery-only. It never downloads full text and never
    invokes Sci-Hub. Use the separate paper_fetch MCP server for an identified
    paper that may be read through open access or the user's lawful access.
    """

    normalized_query = query.strip()
    if not normalized_query:
        raise ValueError("query must not be empty")
    if len(normalized_query) > 2_000:
        raise ValueError("query must not exceed 2000 characters")
    if not 1 <= max_results_per_source <= MAX_RESULTS_PER_SOURCE:
        raise ValueError(
            f"max_results_per_source must be between 1 and {MAX_RESULTS_PER_SOURCE}"
        )
    if year is not None and not re.fullmatch(r"\d{4}(?:-\d{4})?", year.strip()):
        raise ValueError("year must be YYYY or YYYY-YYYY")

    selected_sources = _normalize_sources(sources)
    result = await upstream_search_papers(
        query=normalized_query,
        max_results_per_source=max_results_per_source,
        sources=",".join(selected_sources),
        year=year.strip() if year is not None else None,
    )
    result["adapter_policy"] = {
        "access_mode": SEARCH_POLICY["accessMode"],
        "sources": selected_sources,
        "full_text_capability": "mcp__paper_fetch__fetch_paper",
        "scihub_allowed": False,
    }
    return result


def main() -> None:
    server.run(transport="stdio")


if __name__ == "__main__":
    main()
