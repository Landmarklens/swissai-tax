# SwissAI Tax - Deployment Setup Guide

## GitHub Actions CI/CD Configuration

The CI/CD pipeline is configured to run automatically but requires AWS credentials for deployment.

### Setting Up AWS Credentials (Optional)

If you want to enable automatic deployment to AWS App Runner, follow these steps:

1. **Go to Repository Settings**
   - Navigate to your GitHub repository
   - Click on `Settings` → `Secrets and variables` → `Actions`

2. **Add Required Secrets**
   - Click "New repository secret" for each:
   
   | Secret Name | Description |
   |------------|-------------|
   | `AWS_ACCESS_KEY_ID` | Your AWS Access Key ID |
   | `AWS_SECRET_ACCESS_KEY` | Your AWS Secret Access Key |

3. **AWS IAM Permissions Required**
   The AWS user/role needs the following permissions:
   - `apprunner:*` - For App Runner deployment
   - `iam:CreateServiceLinkedRole` - For App Runner service
   - `ec2:DescribeVpcs` - For VPC configuration

### CI/CD Pipeline Stages

The pipeline runs in the following order:

1. **Backend CI** - Python code quality checks
   - Black formatting
   - isort import sorting  
   - Flake8 linting

2. **Frontend CI** - React build and security
   - npm audit for vulnerabilities
   - Build validation

3. **Security Scan** - Trivy vulnerability scanning
   - Scans for CRITICAL and HIGH vulnerabilities

4. **Deploy Backend** (Optional - requires AWS credentials)
   - Deploys to AWS App Runner
   - Only runs on main branch
   - Skips if credentials not configured

5. **Deployment Notification**
   - Summary of pipeline results

### Running Without AWS Deployment

The pipeline will work perfectly without AWS credentials:
- All CI checks will run
- Security scanning will complete
- Only the deployment step will be skipped
- The pipeline will still pass successfully

### Local Development

For local development:

```bash
# Install dependencies
npm install --legacy-peer-deps

# Run frontend
npm start

# Run backend
cd backend
python -m pip install -r requirements.txt
python app.py
```

### Manual Deployment

If you prefer manual deployment:

1. **Frontend (Amplify)**
   ```bash
   npm run build
   # Upload build folder to AWS Amplify
   ```

2. **Backend (App Runner)**
   ```bash
   # Push to main branch triggers App Runner auto-deployment
   git push origin main
   ```

### Troubleshooting

**Issue**: "Credentials could not be loaded" error
- **Solution**: This is expected if AWS credentials are not configured. The pipeline will continue and complete successfully.

**Issue**: Deployment fails
- **Check**: Ensure AWS credentials have proper permissions
- **Verify**: App Runner service exists and is in RUNNING state

### Support

For deployment issues, check:
- GitHub Actions logs
- AWS App Runner console
- AWS CloudWatch logs