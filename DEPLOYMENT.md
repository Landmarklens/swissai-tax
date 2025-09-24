# SwissAI Tax - Deployment Guide

## 🚀 Architecture Overview

The SwissAI Tax application uses a modern, scalable architecture:

- **Frontend**: React app hosted on AWS Amplify (swissai.tax)
- **Backend**: FastAPI on AWS App Runner (api.swissai.tax)
- **Database**: PostgreSQL on RDS (shared cluster)
- **Storage**: S3 for documents
- **Secrets**: AWS Parameter Store

## 📦 Backend Deployment (App Runner)

### Why App Runner?

We chose AWS App Runner over Lambda for several reasons:

1. **No cold starts** - Always warm, instant response
2. **Persistent DB connections** - Better performance with PostgreSQL
3. **Cost-effective** - $5-25/month for consistent traffic
4. **Auto-scaling** - Scales from 0 to thousands of requests
5. **Simple deployment** - Direct from GitHub

### Prerequisites

1. AWS CLI configured
2. GitHub repository (trustorno/swissai-tax)
3. RDS database running
4. Parameters in AWS Parameter Store

### Manual Deployment Steps

#### 1. Connect GitHub to App Runner

```bash
# Create GitHub connection in AWS Console
# Go to App Runner > GitHub connections > Create connection
# Authorize AWS to access trustorno/swissai-tax repository
```

#### 2. Create App Runner Service

```bash
# Using AWS Console:
1. Go to App Runner in AWS Console
2. Click "Create service"
3. Source: GitHub
4. Repository: trustorno/swissai-tax
5. Branch: main
6. Source directory: / (root - monorepo)
7. Deployment trigger: Automatic
8. Configuration file: apprunner.yaml in repository
```

#### 3. Configure Service Settings

- **Service name**: swissai-tax-api
- **CPU**: 0.25 vCPU
- **Memory**: 0.5 GB
- **Port**: 8000
- **Health check path**: /health
- **Auto scaling**: Default configuration

#### 4. Set Environment Variables (if needed)

The app reads from AWS Parameter Store, but you can override:

```bash
AWS_DEFAULT_REGION=us-east-1
PYTHONPATH=/app/backend
PORT=8000
```

### Automated Deployment (GitHub Actions)

Every push to `main` branch automatically deploys if App Runner auto-deployment is enabled.

### Using ECR (Alternative Method)

If you prefer Docker deployment:

```bash
# Run the deployment script
cd backend
./deploy-apprunner.sh
```

This script will:
1. Build Docker image
2. Push to ECR
3. Create/update App Runner service
4. Configure health checks

## 🌐 Frontend Deployment (Amplify)

### Current Setup

Frontend is automatically deployed via AWS Amplify:

```yaml
# amplify.yml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: build
    files:
      - '**/*'
```

### Manual Deployment

```bash
# Build locally
npm run build

# Deploy to Amplify (if not using auto-deploy)
amplify publish
```

## 🗄️ Database Setup

### Connect to Database

```bash
# SSH Tunnel (for local development)
ssh -N -L 15433:webscraping-database.cluster-c9y2u088elix.us-east-1.rds.amazonaws.com:5432 \
    ubuntu@3.221.26.92 -i ~/Desktop/HomeAiCode/id_rsa

# Connect via psql
PGPASSWORD=IXq3IC0Uw6StMkBhb4mb psql \
    -h localhost -p 15433 \
    -U webscrapinguser -d swissai_tax_db
```

### Run Migrations

```bash
# Apply schema
psql -h localhost -p 15433 -U webscrapinguser -d swissai_tax_db \
    -f backend/database/schema.sql

# Seed data
psql -h localhost -p 15433 -U webscrapinguser -d swissai_tax_db \
    -f backend/database/seed_questions.sql
```

## 🔑 Secrets Management

All secrets are stored in AWS Parameter Store:

```bash
# List all parameters
aws ssm get-parameters-by-path --path "/swissai-tax" --recursive

# Update a parameter
aws ssm put-parameter --name "/swissai-tax/db/password" \
    --value "new-password" --type "SecureString" --overwrite
```

### Required Parameters

- `/swissai-tax/db/host` - RDS endpoint
- `/swissai-tax/db/port` - Database port (5432)
- `/swissai-tax/db/database` - Database name (swissai_tax_db)
- `/swissai-tax/db/username` - Database user
- `/swissai-tax/db/password` - Database password (SecureString)
- `/swissai-tax/db/schema` - Database schema (swisstax)
- `/swissai-tax/s3/documents-bucket` - S3 bucket name
- `/swissai-tax/ssh/host` - SSH bastion host
- `/swissai-tax/ssh/user` - SSH user

## 🌍 DNS Configuration

### Current Setup

- Frontend: swissai.tax → Amplify
- API: Deployed via App Runner (no custom domain yet)

### App Runner Domain Setup

```bash
# Get App Runner service URL
SERVICE_URL=$(aws apprunner list-services --region us-east-1 \
    --query "ServiceSummaryList[?ServiceName=='swissai-tax-api'].ServiceUrl" \
    --output text)

# The API is accessible at the App Runner URL
# Custom domain can be configured if needed
```

## 🧪 Testing Deployment

### Health Check

```bash
# Test App Runner
curl https://[app-runner-url]/health

# Expected response:
{
  "status": "healthy",
  "service": "swissai-tax-api",
  "database": "connected",
  "timestamp": "2024-09-24T10:00:00Z"
}
```

### API Documentation

FastAPI provides automatic API documentation:

- Swagger UI: https://[app-runner-url]/api/docs
- ReDoc: https://[app-runner-url]/api/redoc

### Test Endpoints

```bash
# Start interview
curl -X POST https://[app-runner-url]/api/interview/start \
  -H "Content-Type: application/json" \
  -d '{"taxYear": 2024, "language": "en"}'

# Get all questions
curl https://[app-runner-url]/api/interview/questions?language=en
```

## 📊 Monitoring

### CloudWatch Logs

```bash
# View App Runner logs
aws logs tail /aws/apprunner/swissai-tax-api --follow

# View Amplify logs
amplify logs
```

### Metrics

App Runner provides metrics in CloudWatch:
- Request count
- Request latency
- CPU utilization
- Memory utilization
- Active instances

## 🔧 Troubleshooting

### Database Connection Issues

1. Check Parameter Store values
2. Verify RDS security group allows App Runner
3. Check connection pool settings

### App Runner Issues

```bash
# Get service details
aws apprunner describe-service \
    --service-arn [service-arn] \
    --region us-east-1

# Check deployment status
aws apprunner list-operations \
    --service-arn [service-arn] \
    --region us-east-1
```

### Rollback

```bash
# App Runner keeps previous versions
# Rollback via console or:
aws apprunner update-service \
    --service-arn [service-arn] \
    --source-configuration '{"ImageRepository": {"ImageIdentifier": "previous-image-tag"}}'
```

## 💰 Cost Optimization

### Current Monthly Costs (Estimate)

- App Runner: $5-25 (based on usage)
- RDS (shared): $15-30
- S3: $1-5
- Amplify: $5-10
- **Total**: ~$26-70/month

### Scaling Considerations

As traffic grows:
- App Runner auto-scales (pay per use)
- Consider RDS proxy for connection pooling
- Enable CloudFront for static assets
- Use ElastiCache for session storage

## 🚀 CI/CD Pipeline

### Current Flow

1. Developer pushes to `main` branch
2. GitHub Actions runs tests (if configured)
3. Amplify auto-builds frontend
4. App Runner auto-deploys backend (if enabled)
5. Health checks verify deployment

### Future Improvements

- Add staging environment
- Implement blue-green deployments
- Add automated testing in pipeline
- Set up monitoring alerts

## 📝 Maintenance

### Regular Tasks

- Review CloudWatch logs weekly
- Update dependencies monthly
- Backup database regularly
- Review and rotate secrets quarterly

### Updates

```bash
# Update Python packages
cd backend
pip-compile requirements-apprunner.in
git add requirements-apprunner.txt
git commit -m "Update dependencies"
git push # Auto-deploys

# Update frontend packages
npm update
npm audit fix
git add package-lock.json
git commit -m "Update frontend dependencies"
git push # Auto-deploys
```

## 🆘 Support

For issues or questions:
1. Check CloudWatch logs
2. Review this documentation
3. Check AWS service health
4. Contact team lead

---

Last updated: September 2024
Version: 1.0.0