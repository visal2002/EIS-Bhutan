# EIS Bhutan Backend (Django)

This repository contains the Django REST Framework backend for the Energy Information System (EIS).

## Tech Stack
- **Framework**: Django 5.0, Django REST Framework
- **Database**: PostgreSQL (Production/Staging), SQLite (Development fallback)
- **Background Tasks**: Celery, Redis
- **Authentication**: JWT (SimpleJWT)

## Local Development Setup

1. **Prerequisites**
   Ensure you have Python 3.10+ installed.

2. **Virtual Environment**
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\Activate.ps1
   # macOS/Linux:
   source venv/bin/activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements/development.txt
   ```

4. **Environment Variables**
   Create a `.env` file in the `eis-backend-staging` folder with PostgreSQL credentials:
   ```env
   DB_NAME=eis_jdms_db
   DB_USER=eis_jdms_user
   DB_PASSWORD=localpassword123
   DB_HOST=127.0.0.1
   DB_PORT=5432
   ```
   *(Note: By default in local dev, if PostgreSQL fails, we temporarily fallback to SQLite per recent configuration changes. Ideally, setup the DB as above).*

5. **Run Migrations & Start Server**
   ```bash
   python manage.py migrate
   python manage.py runserver 8000
   ```

6. **Run Tests**
   ```bash
   python manage.py test eis_core
   ```

## Folder Structure
- `config/`: Django settings (`base.py`, `development.py`, `production.py`)
- `eis_core/`: Core abstract models (`TimeStampedModel`, `SoftDeleteModel`) and base exceptions.
- `eis_apps/`: Feature modules including `authentication`, `master_data`, `reporting`, etc.
