# EIS-Bhutan

**Environment Information System** — Bhutan's unified platform for energy data collection, cross-sector analytics, and IPCC-aligned GHG reporting across all 20 dzongkhags and 9 energy streams.

## Features

- **Interactive Dashboards** — Recharts-powered data visualization with Sankey diagrams, maps, and trend charts
- **Bhutan Map** — SVG-based dzongkhag-level energy data exploration with hover tooltips
- **Role-Based Access** — 5 user roles (Admin, DOE Head, Data Manager, Data Focal, Viewer) with granular module-level permissions
- **NDI Integration** — Bhutan National Digital Identity wallet login via QR code
- **Master Data Engine** — Generic CRUD interface for 9 master data modules (sectors, vehicle types, conversion factors, etc.)
- **Dark Mode** — System-aware theme switching with manual override
- **Responsive Design** — Fully optimized for mobile, tablet, and desktop

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS 3 |
| Charts | Recharts |
| Animation | Framer Motion |
| Icons | Lucide React |
| Backend | Django, Django REST Framework |
| Auth | JWT + Bhutan NDI |

## Getting Started

> **⚠️ IMPORTANT: Dual Terminal Setup**
> This application requires **both** the frontend and backend servers to be running simultaneously in **two separate terminal windows**. The frontend will not be able to fetch data if the backend is not running.

### Prerequisites

- **Node.js** v16+ and **npm** v8+
- **Python** v3.10+ (for backend)

### Terminal 1: Backend Setup

Open your first terminal and run:

```bash
cd eis-backend
pip install -r requirements/development.txt
python manage.py migrate
python manage.py runserver   # Starts API at http://localhost:8000
```

*(Leave this terminal open and running!)*

### Terminal 2: Frontend Setup

Open a **new, second terminal window** and run:

```bash
cd eis-frontend
cp .env.example .env        # Configure API URL
npm install --legacy-peer-deps
npm run dev                  # Starts UI at http://localhost:5173
```

*(Leave this terminal open and running!)*

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `/api` | Backend API base URL. In development, Vite proxies `/api` to `localhost:8000` automatically. |

## Project Structure

```
eis-frontend/
├── public/images/           # Static images (logos, hero, map assets)
├── src/
│   ├── App.jsx              # Root component with route definitions
│   ├── main.jsx             # Entry point, context providers
│   ├── styles/              # Global CSS (Tailwind directives)
│   ├── components/
│   │   ├── admin/           # Admin-specific components (UserDrawer)
│   │   └── layout/          # Layout components (Header, Sidebar, Footer)
│   ├── constants/           # Static data (dzongkhag data, energy data, routes)
│   ├── context/             # React Context providers (Theme, Permissions, Site Settings)
│   ├── hooks/               # Custom React hooks
│   ├── pages/
│   │   ├── admin/           # Protected admin pages (Dashboard, User Management, Settings)
│   │   │   └── master-data/ # Master data modules (generic CRUD engine)
│   │   └── auth/            # Public pages (Landing, Login, Public Dashboard)
│   ├── services/            # API service layer (fetch wrapper, auth helpers)
│   └── utils/               # Utility functions (cn, getInitials)
├── .env.example             # Environment variable template
├── vite.config.js           # Vite config with API proxy
├── tailwind.config.js       # Tailwind theme customization
└── package.json
```

## Build for Production

```bash
cd eis-frontend
npm run build     # Output: dist/
npm run preview   # Preview production build locally
```

## License

This project is licensed under the MIT License.
