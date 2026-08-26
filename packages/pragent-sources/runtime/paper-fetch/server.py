"""Read-only MCP facade for known-paper acquisition."""

from __future__ import annotations

import tempfile
from pathlib import Path
from typing import Annotated, Literal

from mcp.server.mcpserver import MCPServer
from mcp.server.mcpserver.exceptions import ToolError
from mcp.types import CallToolResult, ToolAnnotations
from paper_fetch.mcp._deps import default_mcp_deps
from paper_fetch.mcp.fetch_tool import (
    fetch_paper_tool_async,
    has_fulltext_tool,
    resolve_paper_tool,
)
from paper_fetch.mcp.output_schemas import (
    FetchPaperOutput,
    HasFulltextOutput,
    ResolvePaperOutput,
)
from pydantic import Field


deps = default_mcp_deps()
server = MCPServer(
    name="CyberEinstein Known Paper Reader",
    version="0.1.0",
    instructions=(
        "Resolve and read an identified paper through open access or the user's "
        "lawful access. This facade never writes artifacts and never prepares a browser."
    ),
)
READ_ONLY_NETWORK = ToolAnnotations(read_only_hint=True, open_world_hint=True)
RUNTIME_DIR = tempfile.TemporaryDirectory(prefix="cybereinstein-paper-fetch-")


def _runtime_download_dir() -> Path:
    return Path(RUNTIME_DIR.name)


def _normalize_query(query: str) -> str:
    normalized = query.strip()
    if not normalized:
        raise ToolError("query must not be empty")
    if len(normalized) > 2_048:
        raise ToolError("query must not exceed 2048 characters")
    return normalized


@server.tool(
    name="resolve_paper",
    description="Resolve a known DOI, URL, or title into a normalized paper candidate.",
    annotations=READ_ONLY_NETWORK,
    structured_output=True,
)
def resolve_paper(
    query: str,
) -> Annotated[CallToolResult, ResolvePaperOutput]:
    return resolve_paper_tool(query=_normalize_query(query), deps=deps)


@server.tool(
    name="has_fulltext",
    description="Probe whether a known paper appears to have lawfully accessible full text.",
    annotations=READ_ONLY_NETWORK,
    structured_output=True,
)
def has_fulltext(
    query: str,
) -> Annotated[CallToolResult, HasFulltextOutput]:
    return has_fulltext_tool(query=_normalize_query(query), deps=deps)


@server.tool(
    name="fetch_paper",
    description=(
        "Read a known paper as bounded structured content without writing local "
        "artifacts, preparing browsers, or bypassing access controls."
    ),
    annotations=READ_ONLY_NETWORK,
    structured_output=True,
)
async def fetch_paper(
    query: str,
    max_tokens: Annotated[int, Field(ge=500, le=50_000)] = 12_000,
    include_refs: Literal["none", "top10", "all"] = "top10",
    prefer_cache: bool = False,
) -> Annotated[CallToolResult, FetchPaperOutput]:
    return await fetch_paper_tool_async(
        query=_normalize_query(query),
        include_refs=include_refs,
        max_tokens=max_tokens,
        prefer_cache=prefer_cache,
        no_download=True,
        artifact_mode="none",
        save_markdown=False,
        browser_auto_prepare=False,
        download_dir=_runtime_download_dir(),
        deps=deps,
    )


def main() -> None:
    server.run(transport="stdio")


if __name__ == "__main__":
    main()
