# Market data

Current quotes come from the backend's external `PriceProvider` and short-lived
TTL cache; provider ticks are not persisted in PostgreSQL. Durable user history
lives in self-contained `asset_value_history` points (value, quantity, price,
purchase price, FX, source and observed time).

The frontend does not call providers directly. Asset/dashboard endpoints return
values resolved by the backend. Manual price updates remain available as an
override/fallback while no real provider adapter is configured.
