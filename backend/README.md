# Knot Backend – Face Recognition Service

A specialized Express.js service dedicated to image processing and face recognition using `face-api.js`.

## Overview

This service acts as the "brain" of Knot. It handles:
- **Face Detection**: Identifying faces in uploaded images (HEIC/JPEG/PNG).
- **Embedding Generation**: Creating high-dimensional vectors (descriptors) for detected faces.
- **Face Matching**: Comparing a query selfie against a database of embeddings to find matches.
- **HEIC Conversion**: Converting high-efficiency images to JPEG for processing and browser compatibility.

## Tech Stack

- **Node.js**: ES Modules (type: "module")
- **Express**: Web framework
- **face-api.js**: TensorFlow.js-based face recognition library
- **canvas**: Node.js implementation of the Canvas API for server-side image processing
- **heic-convert**: Logic for HEIC -> JPEG transformation

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Setup Models**:
   Ensure the `models/` directory contains the necessary pre-trained weights:
   - `ssd_mobilenet_v1_model-weights_manifest.json`
   - `face_landmark_68_model-weights_manifest.json`
   - `face_recognition_model-weights_manifest.json`
3. **Configure Environment**:
   ```bash
   cp .env.example .env
   ```
   *Required variables*: `PORT`, `FRONTEND_URL`, `DATABASE_URL`.
   
   **Database Setup**:
   The system is modular and supports:
   - **Local PostgreSQL**: Use `postgresql://user:password@localhost:5432/db`
   - **Cloud Providers (Neon, Supabase, Vercel)**: The client handles SSL automatically if `neon.tech` or `supabase.co` is in the URL, or if `?sslmode=require` is appended.
   
   **Initialize Database**:
   After setting your `DATABASE_URL`, run the initialization script to create tables:
   ```bash
   node src/scripts/init-db.js
   ```
## Development

```bash
npm run dev
```
Starts the server with `--watch` mode on `http://localhost:5000`.

## API Endpoints

### 1. Face Matching
`POST /api/faces/match`
Compares a query image (base64) against stored vectors for a specific event.

**Request Body**:
```json
{
  "image": "data:image/jpeg;base64,...",
  "eventId": "uuid-or-code"
}
```

### 2. Face Processing
`POST /api/faces/process`
Processes an uploaded image to detect faces and store embeddings.

**Request Body**:
```json
{
  "link": "/uploads/filename.jpg",
  "eventId": "uuid"
}
```

### 3. Health Check
`GET /api/health`
Returns system status, uptime, and timestamp.

## Project Structure

- `src/app.js`: Express configuration and middleware (CORS, body-parser).
- `src/routes/face.js`: Core logic for `face-api.js` integration and matching algorithms.
- `src/utils/image.js`: Image conversion utilities (HEIC support).
- `models/`: Weights and manifests for AI models.

## Logic Details

- **Algorithm**: Euclidean Distance is used to compare descriptors.
- **Matched Threshold**: Currently set to `< 0.48` for unique image matches and `< 0.55` for raw matches.
- **Performance**: Uses `SSD Mobilenet v1` for robust face detection. Small background faces are filtered out (min size: 80px).

---
*Note: This service is intended for internal use and is typically proxied by the frontend.*

