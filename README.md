# Knowledge Graph

This repository contains an extraction pipeline (Person 1) and a Neo4j loader, GraphQA and API (Person 2).

Quickstart

- Install dependencies: python -m pip install -r requirements.txt
- Run unit tests: python -m unittest discover -v tests
- To run full stack locally: copy .env.example -> .env, set NEO4J_PASSWORD and KG_API_KEY, then docker compose up --build

API

The FastAPI app is provided by `src.api:create_app`. It exposes /ingest and /graphqa and requires the `KG_API_KEY` header when set.

CI

A GitHub Actions workflow runs unit tests and contains a scaffolded integration job for running Neo4j in CI.

