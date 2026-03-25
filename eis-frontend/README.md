# EIS Bhutan Frontend (React/Vite)

This repository contains the interactive frontend dashboard for analyzing energy consumption and performance metrics.

## Tech Stack
- **Core Library**: React 18, React Router v6
- **Build Tool**: Vite
- **Styling**: Tailwind CSS, Framer Motion
- **Data Visualization**: Recharts
- **HTTP Client**: Axios

## Local Development Setup

1. **Prerequisites**
   Ensure you have Node.js 18+ installed.

2. **Install Dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```
   *(Note: The `--legacy-peer-deps` flag is recommended due to peer dependency mismatches with some charting/motion libraries).*

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   The site will be available at `http://localhost:5173`. Make sure the Django backend is concurrently running on port `8000`.

## Features
- Dynamic fetching of master data (sectors, vehicle types, energy supplies)
- Responsive Tailwind grid system tailored for administrative dashboards.
- Native interactive SVG map capabilities for geographical data binding.

## Project Structure
- `src/components/`: Reusable, generic UI and structural layouts (e.g. Navbars).
- `src/pages/`: Route-level views categorized by feature (`admin/`, `auth/`, etc).
- `src/services/`: API integration and request interceptors (`api.js`).
- `src/context/`: Global React context states (Themes, Permissions, etc).
- `src/constants/`: Static lookup arrays/objects.
