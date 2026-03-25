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

### Prerequisites

- **Node.js** v16+ and **npm** v8+
- **Python** v3.10+ (for backend)

### Frontend Setup

```bash
cd eis-frontend
cp .env.example .env        # Configure API URL
npm install --legacy-peer-deps
npm run dev                  # Starts at http://localhost:5173
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `/api` | Backend API base URL. In development, Vite proxies `/api` to `localhost:8000` automatically. |

### Backend Setup

```bash
cd eis-backend
pip install -r requirements/local.txt
python manage.py migrate
python manage.py runserver   # Starts at http://localhost:8000
```

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
