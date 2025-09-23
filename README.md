# SwissAI Tax

AI-powered tax filing assistant for Swiss residents.
Live at: https://swissai.tax

## Project Structure

```
swissai-tax/
├── backend/          # Python backend (Lambda functions)
├── src/              # React frontend application
├── public/           # Static assets
├── infrastructure/   # AWS infrastructure configs
└── tests/           # Test suites
```

## Tech Stack

### Backend
- Python 3.11
- AWS Lambda
- PostgreSQL (Aurora)
- AWS Textract (OCR)

### Frontend
- React 18.3
- Material-UI
- Redux Toolkit
- i18next (Multi-language)

### Infrastructure
- AWS CodePipeline (Backend CI/CD)
- AWS ECR (Docker registry)
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

### Backend (CodePipeline)
Push to main branch triggers automatic deployment via CodePipeline:
1. Source from GitHub
2. Build Docker image
3. Push to ECR
4. Deploy to ECS/Lambda

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