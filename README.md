# Kirby-Manchester Indoor Navigation — Backend

## Overview

This backend powers the Kirby-Manchester Indoor Navigation System.

It provides:

- Indoor routing across multiple floors
- Search for rooms and facilities
- Nearest facility lookup
- User authentication using JWT
- Navigation history tracking
- Estimated travel time for routes

This system is designed to simulate a real-world indoor navigation backend. It stores building map data as a graph, uses Dijkstra's algorithm to compute shortest paths, and supports both public navigation requests and authenticated user history.

---

## Setup

Install dependencies:

```bash
npm install
```

---

## Run

Start the server:

```bash
npm start
```

By default, the server runs at:

```text
http://localhost:8000
```

---

## API Endpoints

### Health

**GET** `/health`

Checks whether the backend server is running.

Returns the backend status and service name.

---

### Floors

#### GET `/floors`

Returns the list of available floors.

Supported floors:

- Basement (B)
- Ground (0) 
- Floor 1
- Floor 2
- Floor 3

#### GET `/floors/:floor`

Returns the graph data for one floor, including:

- floor number
- nodes on that floor
- edges connected to that floor

---

### Search

**GET** `/search?q=...&floor=...`

Searches nodes by:

- `node_id`
- `label`

The search is case-insensitive and supports partial matching.

Query parameters:

- `q`: required search keyword
- `floor`: optional floor filter

Notes:

- If `floor` is provided, it must be a valid number.
- This endpoint is useful for searching rooms, elevators, stairs, restrooms, and hallway nodes.

---

### Route

**POST** `/route`

Computes the shortest route between two nodes.

Request body fields:

- `start`: starting node ID
- `destination`: destination node ID
- `preference`: optional route preference

Supported `preference` values:

- `none`
- `stairs`
- `elevator`

The route response includes:

- start node
- destination node
- selected preference
- full path
- path grouped by floor
- turn-by-turn instructions
- estimated travel time

Notes:

- The backend uses Dijkstra's algorithm to compute the shortest path.
- The route can span multiple floors.
- If the user is logged in, the route is saved to navigation history.
- If the user is not logged in, the route still works normally, but it is not saved.

---

### Nearest Facility

**GET** `/nearest?from_node=...&type=...`

Finds the nearest facility of a selected type from a starting node.

Query parameters:

- `from_node`: required starting node ID
- `type`: required facility type

Supported facility types:

- `stairs`
- `elevator`
- `mens_restroom`
- `womens_restroom`
- `all_gender_restroom`

The response includes:

- starting node
- requested facility type
- nearest matching facility
- distance
- path to the facility

---

### Authentication

The backend supports user registration and login.

Authentication is only required for saving and viewing navigation history. The main navigation endpoints still work without login.

#### POST `/auth/register`

Creates a new user account.

Request body fields:

- `username`
- `password`

#### POST `/auth/login`

Logs in an existing user and returns a JWT token.

Request body fields:

- `username`
- `password`

Notes:

- Passwords are hashed using bcrypt.
- The token is used for authenticated requests.
- Protected endpoints require an Authorization header.

Header format:

```text
Authorization: Bearer <token>
```

---

### Navigation History

**GET** `/history`

Returns the logged-in user's previous routes.

This endpoint requires authentication.

Optional query parameters:

- `limit`
- `offset`

Notes:

- Each user can only see their own route history.
- Routes are saved automatically when a logged-in user calls `POST /route`.
- Users who are not logged in can still use `POST /route`, but their route is not saved.

---

## Data Model

The indoor map is represented as a weighted graph.

### Nodes

Nodes represent important map points, such as:

- Rooms
- Hallways
- Junctions
- Stairs
- Elevators
- Restrooms
- Other map reference points

Each node stores:

- `node_id`
- `label`
- `type`
- `floor`
- `x`
- `y`

### Edges

Edges represent walkable paths between nodes.

Each edge stores:

- `from`
- `to`
- `distance`

Special design:

- Cross-floor connections use stairs and elevators.
- Cross-floor edges have distance `0`.
- This allows the route algorithm to move between floors.

Data files are stored in:

```text
src/data/
├── combined_nodes.json
└── combined_edges.json
```

---

## Project Structure

```text
src/
├── data/
│   ├── combined_nodes.json
│   └── combined_edges.json
├── routes/
│   ├── auth.js
│   ├── floors.js
│   ├── history.js
│   ├── nearest.js
│   ├── route.js
│   └── search.js
├── services/
│   ├── dijkstra.js
│   ├── graphStore.js
│   ├── instructions.js
│   └── timeEstimate.js
├── db.js
└── server.js
```

### Main Files

- `server.js`: starts the Express server and connects routes
- `db.js`: manages the local database connection
- `routes/auth.js`: handles user registration and login
- `routes/floors.js`: provides floor map data
- `routes/search.js`: handles room and facility search
- `routes/route.js`: computes routes
- `routes/nearest.js`: finds nearest facilities
- `routes/history.js`: returns saved user route history
- `services/dijkstra.js`: implements shortest path logic
- `services/graphStore.js`: loads and stores graph data
- `services/instructions.js`: creates turn-by-turn instructions
- `services/timeEstimate.js`: estimates route travel time

---

## Frontend Integration

The frontend should connect to:

```text
http://localhost:8000
```

Typical frontend usage:

1. Load available floors with `GET /floors`
2. Load one floor's map data with `GET /floors/:floor`
3. Search for a room or facility with `GET /search`
4. Generate a route with `POST /route`
5. Find the nearest facility with `GET /nearest`
6. Register or log in with `POST /auth/register` and `POST /auth/login`
7. View navigation history with `GET /history`

For authenticated requests, include:

```text
Authorization: Bearer <token>
```

---

## Error Handling

The backend returns JSON error messages for invalid requests.

Common error cases include:

- Missing required fields
- Invalid node IDs
- Invalid floor value
- Invalid route preference
- Invalid nearest facility type
- Authentication failure
- Missing or invalid token

---

## Summary

This backend extends a basic indoor navigation system with:

- Multi-floor map support
- Shortest path routing
- Route preference options
- Turn-by-turn instructions
- Estimated travel time
- User authentication
- Persistent navigation history
- Nearest facility search

These features make the project closer to a complete indoor navigation service.
