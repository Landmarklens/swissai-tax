# SwissAI Tax

AI-powered tax filing assistant for Swiss residents.
Live at: https://swissai.tax

## 🚀 Implementation Status

### ✅ Completed Backend
- ✅ Database schema with PostgreSQL and migrations
- ✅ Interview state machine (Q01-Q14 questionnaire)
- ✅ Document generation and requirements logic
- ✅ S3 bucket with encryption & lifecycle policies
- ✅ OCR processing with AWS Textract integration
- ✅ Complete REST API with FastAPI
- ✅ AWS Parameter Store for secrets management
- ✅ Tax calculation engine (Federal/Cantonal/Municipal)
- ✅ Support for 5 major cantons (ZH, BE, LU, BS, ZG)
- ✅ Standard deductions and tax rates for 2024
- ✅ Connection pooling for database performance
- ✅ AWS App Runner deployment configuration

### ✅ Completed Frontend
- ✅ Interview flow with dynamic questionnaire
- ✅ Document upload with drag-and-drop
- ✅ Tax calculation results with charts
- ✅ Redux Toolkit state management
- ✅ Material-UI components
- ✅ API service layer
- ✅ Responsive design

### 🔄 Ready for Deployment
- ✅ FastAPI backend ready for App Runner
- ✅ React frontend ready for Amplify
- ✅ Database schema deployed
- ✅ Deployment documentation (DEPLOYMENT.md)

### 📋 Future Enhancements
- Full multi-language support with i18next
- AWS Cognito authentication
- E-filing integration with authorities
- Payment processing
- Advanced monitoring dashboards

## Project Structure

```
swissai-tax/
├── backend/              # Python backend (FastAPI)
│   ├── alembic/         # Database migrations
│   ├── database/        # DB connection and schemas
│   ├── services/        # Business logic services
│   └── app.py           # Main FastAPI application
├── src/                 # React frontend application
├── public/              # Static assets
├── infrastructure/      # AWS infrastructure configs
└── tests/              # Test suites
```

## Tech Stack

### Backend
- Python 3.11
- FastAPI
- AWS App Runner
- PostgreSQL (Aurora)
- AWS Textract (OCR)

### Frontend
- React 18.3
- Material-UI
- Redux Toolkit
- i18next (Multi-language)

### Infrastructure
- AWS App Runner (Backend hosting)
- AWS Amplify (Frontend hosting)
- AWS S3 (Document storage)

## Setup

### Prerequisites
- Node.js 18+
- Python 3.11
- AWS CLI configured
- Docker

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## Deployment

### Backend (App Runner)
Push to main branch triggers automatic deployment via App Runner:
1. Source from GitHub
2. Build from source code
3. Deploy to App Runner service

### Frontend (Amplify)
Push to main branch triggers automatic deployment via AWS Amplify.

## Environment Variables

Create `.env` files based on `.env.example`:

### Backend (.env)
```bash
DB_HOST=aurora-postgresql-db
DB_SCHEMA=swisstax
AWS_REGION=eu-central-1
```

### Frontend (.env.local)
```bash
REACT_APP_API_URL=https://api.swisstax.ai
REACT_APP_FIREBASE_API_KEY=xxx
```

## Features

- **Interview-based questionnaire** (Q01-Q14)
- **Smart document checklist** based on profile
- **OCR document processing** (Lohnausweis, 3a statements)
- **Tax calculation** (Federal, Cantonal, Municipal)
- **Multi-language support** (DE, FR, EN, IT)
- **E-filing integration** (Coming soon)

## Architecture

- Serverless backend with Lambda functions
- React SPA with Material-UI
- PostgreSQL for data persistence
- S3 for document storage
- Textract for OCR processing

## Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

## Contributing

1. Create feature branch from `dev`
2. Make changes
3. Run tests
4. Submit PR to `dev`
5. After review, merge to `main` for deployment

## License

Private - All rights reserved