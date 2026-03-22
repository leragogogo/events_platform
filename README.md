# Events Platform

A full-stack event management platform built with Vue 3, Node/Express, and MongoDB.

## Link to Video Demo
- [Demo](https://drive.google.com/file/d/1LxrFyU0lBppmgdOJm_3Lqy4B3OX3Xfa5/view?usp=sharing)

## Running with Docker Compose

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Docker Compose)

### 1. Clone repository

```bash
git clone https://github.com/leragogogo/events_platform.git
cd events_platform
```

### 2. Configure environment variables

Copy the example file and fill in the required values:

```bash
// Linux/Mac
cp .env.example .env
// Windows
copy .env.example .env
```


Open `.env` and set the following:

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string. Use the string provided in the report in Links section. |
| `JWT_SECRET` | Yes | Secret used to sign auth tokens. Generate one with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `CONTACT_EMAIL` | Yes | Your email address. It's required by the [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/) for geocoding |
| `CORS_ORIGIN` | No | Origin the browser uses to reach the app (default: `http://localhost`) |
| `ACTIVITY_TTL_DAYS` | No | Days before activity feed entries expire (default: `14`) |

### 3. Build and start

```bash
docker compose up --build
```
### 4. Open the app

Navigate to [http://localhost](http://localhost) in your browser.
