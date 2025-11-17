# Code Review Summary

## Overview
- The project is a single-page Leaflet map experience built into `index.html`, bundling configuration, styles, and scripting for an interactive Cleveland 1945 theatre map.
- Supporting data lives alongside the page: film metadata in `nowshowing.json` and theatre geometries in the accompanying GeoJSON files, with image assets in `images/` and fonts under `fonts/`.

## Map configuration and resilience
- `index.html` defines a `RS_CONFIG` bootstrap script that merges user-provided settings with defaults for tile sources and responsive layout variables, including optional auto-detection for high-resolution displays. The script also exposes `RS_TILE_MODE` and `RS_ONLINE_TILES` globals to downstream code.
- Later in the page, a defensive shim normalizes access to the Leaflet map object by preferring `rsMap`/`RS_MAP` if present and installing no-op stubs when nothing is available, preventing runtime errors when map initialization changes.

## UI behavior and DOM wiring
- Inline scripts run after the consolidated CSS to reshape the theatre listing: MutationObservers rebuild each card so status chips and addresses sit under the title band and remove duplicate chips when lists are refreshed.
- Additional observers keep the sidebar list styled consistently by adding an `rs-inline-meta` namespace class and re-running the rebuild logic as items mutate, ensuring layout resilience during pagination or search filtering.

## Observations and opportunities
- The single bundled HTML is convenient for deployment but makes the codebase hard to navigate; extracting the major scripts and styles into modules would improve readability and testability.
- The DOM-wiring scripts rely on query selectors like `#rs-list .rs-li` and injected class names; centralizing selectors/constants could reduce brittleness if the markup evolves.
- Consider documenting the expected structure of the GeoJSON properties and the `nowshowing.json` schema to aid future data updates.
