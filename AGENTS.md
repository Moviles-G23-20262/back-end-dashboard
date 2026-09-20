# Developer Admin Dashboard

This is an internal admin dashboard designed for the developer team (not end clients). 

## Tech Stack & Architecture

- **Frontend:** React (powered by Vite)
- **Backend:** NestJS
- **Database / ORM:** Prisma (`./schema.prisma`)

---

## Technical Guidelines & Project Structure

### 1. Types & Interfaces (`src/types.ts`)
- All TypeScript types, interfaces, DTOs (Data Transfer Objects), and entity definitions **must** be written in `src/types.ts`.
- Derive entity interfaces directly from `./schema.prisma`.
- Include types for API request/response payloads, query parameters, pagination, and raw SQL query results.

### 2. API Communication Layer (`src/api/`)
- Place all API client functions and HTTP service calls inside the `src/api/` directory.
- Follow the modular naming convention per entity:
  - `src/api/entity1.ts`
  - `src/api/entity2.ts`
  - `src/api/rawSql.ts`
  - `src/api/metadata.ts`
- Functions in this folder should handle requests/responses using the types imported from `src/types.ts`.

---

## Core Features & Dashboard Capabilities

1. **Database Schema & CRUD Operations:**
   - Refer to `./schema.prisma` for all database entity attributes and relations.
   - The dashboard must render interactive data tables for every entity in the database.
   - Provide full CRUD capabilities (Create, Read, Update, Delete) for all entities and tables.

2. **Backend Route Inspection (NestJS Introspection):**
   - The NestJS backend dynamically exposes API endpoint metadata (e.g., via `SwaggerModule.createDocument()` or `HttpAdapterHost`).
   - Create a dedicated view in the dashboard listing all registered backend routes, their HTTP methods (`GET`, `POST`, `PUT`, `DELETE`), controllers, and payload shapes.

3. **Raw SQL Console:**
   - Include a SQL command runner interface that allows developers to write and execute arbitrary raw SQL queries directly against the database.
   - Display returned results cleanly in structured data grids or formatted JSON viewers.

### Styling Guidelines (Tailwind CSS)
- **Framework:** Tailwind CSS is used for styling.
- **Global Styles & Custom Classes:** Refer to `src/index.css` for existing utility and component classes shared with our main client-facing application.
- **Custom Utility Reuse:** When building components, reuse existing custom classes defined in `src/index.css` to maintain visual consistency across our applications rather than redefining them.