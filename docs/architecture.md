# CTRL SEA Runtime Architecture

```mermaid
flowchart LR
  Browser --> Next[Next.js 15]
  Next -->|same-origin /api| API[FastAPI]
  API --> Cache[5-minute in-process analytics cache]
  Cache --> DW[(ITI_Graduation_PortWatch)]
  API --> Users[(dbo.AppUser)]
  Next --> OSM[OpenStreetMap tiles]
  Next --> PBI[Power BI secure embed]
```

Authentication uses rotating access and refresh JWTs stored only in HTTP-only cookies. Next middleware blocks anonymous protected-page requests; FastAPI remains the authorization authority and applies role checks to admin APIs.

The warehouse service queries the fourteen `portwatch_dw` tables directly. Current-state queries use recent windows and present-risk scenarios, pagination limits list endpoints, large responses are gzip-compressed, and cache request coalescing prevents duplicate cold scans.

Leaflet, React Leaflet, and MarkerCluster are isolated in a browser-only dynamic chunk. MarkerCluster loads only after Leaflet is assigned to `window.L`.
