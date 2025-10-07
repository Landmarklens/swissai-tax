# AWS SES Password Reset Setup Guide

## Overview
This guide covers the setup required to enable password reset emails via AWS SES (Simple Email Service).

## Prerequisites
- AWS account with access to SES and Systems Manager (Parameter Store)
- AWS CLI configured with appropriate credentials
- Domain or email address to use as sender

---

## Step 1: Verify Sender Email in AWS SES

### Option A: Verify Individual Email Address (Sandbox/Testing)

1. **Navigate to AWS SES Console**
   - Go to: https://console.aws.amazon.com/ses/
   - Select region: `us-east-1` (or your configured `AWS_REGION`)

2. **Verify Email Address**
   ```bash
   # Using AWS CLI
   aws ses verify-email-identity \
     --email-address noreply@swissai.tax \
     --region us-east-1
   ```

   Or via console:
   - Go to: SES → Verified identities → Create identity
   - Choose "Email address"
   - Enter: `noreply@swissai.tax`
   - Click "Create identity"

3. **Check Verification Email**
   - Check the inbox for the verification email
   - Click the verification link

### Option B: Verify Domain (Production Recommended)

1. **Verify Domain**
   ```bash
   # Using AWS CLI
   aws ses verify-domain-identity \
     --domain swissai.tax \
     --region us-east-1
   ```

   Or via console:
   - Go to: SES → Verified identities → Create identity
   - Choose "Domain"
   - Enter: `swissai.tax`
   - Click "Create identity"

2. **Add DNS Records**
   - Copy the TXT record provided by SES
   - Add to your DNS provider (e.g., Route53, Cloudflare)
   - Wait for DNS propagation (can take up to 72 hours, usually < 1 hour)

3. **Verify Status**
   ```bash
   aws ses get-identity-verification-attributes \
     --identities swissai.tax \
     --region us-east-1
   ```

---

## Step 2: Move Out of SES Sandbox (Production Only)

By default, SES is in "sandbox mode" which restricts sending to verified emails only.

1. **Request Production Access**
   - Go to: SES → Account dashboard → Request production access
   - Fill out the form:
     - **Mail Type**: Transactional
     - **Website URL**: https://swissai.tax
     - **Use Case Description**:
       ```
       SwissAI Tax is a tax filing application for Swiss taxpayers.
       We need to send password reset emails to our users.
       Expected volume: ~100 emails/day
       ```
     - **Compliance**: Confirm you have processes in place

2. **Wait for Approval** (typically 24-48 hours)

---

## Step 3: Store SES Sender Email in Parameter Store

```bash
# Set the verified sender email in Parameter Store
aws ssm put-parameter \
  --name "/swissai-tax/email/sender" \
  --value "noreply@swissai.tax" \
  --type "String" \
  --description "Verified SES sender email for SwissAI Tax" \
  --region us-east-1 \
  --overwrite
```

Verify it was stored:
```bash
aws ssm get-parameter \
  --name "/swissai-tax/email/sender" \
  --region us-east-1
```

---

## Step 4: Configure IAM Permissions

Ensure your EC2/App Runner instance role has SES permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters"
      ],
      "Resource": [
        "arn:aws:ssm:us-east-1:*:parameter/swissai-tax/*",
        "arn:aws:ssm:us-east-1:*:parameter/homeai/prod/*"
      ]
    }
  ]
}
```

**Apply to your App Runner or EC2 instance role:**
- Find your instance role in IAM
- Attach the above policy (create custom policy if needed)

---

## Step 5: Test Email Sending

### Using AWS CLI (Quick Test)

```bash
aws ses send-email \
  --from noreply@swissai.tax \
  --destination ToAddresses=YOUR_EMAIL@example.com \
  --message Subject={Data="Test Email",Charset=UTF-8},Body={Text={Data="This is a test",Charset=UTF-8}} \
  --region us-east-1
```

### Using the Application API

1. **Start the backend** (if running locally)
   ```bash
   cd backend
   python -m uvicorn main:app --reload
   ```

2. **Test password reset endpoint**
   ```bash
   curl -X POST http://localhost:8000/api/auth/reset-password/request \
     -H "Content-Type: application/json" \
     -d '{"email": "YOUR_EMAIL@example.com"}'
   ```

3. **Check your email** for the password reset link

---

## Step 6: Monitor SES

### Set up CloudWatch Alarms (Recommended)

1. **Monitor Bounce Rate**
   ```bash
   aws cloudwatch put-metric-alarm \
     --alarm-name "SES-High-Bounce-Rate" \
     --alarm-description "Alert when SES bounce rate exceeds 5%" \
     --metric-name Reputation.BounceRate \
     --namespace AWS/SES \
     --statistic Average \
     --period 86400 \
     --threshold 0.05 \
     --comparison-operator GreaterThanThreshold \
     --evaluation-periods 1 \
     --region us-east-1
   ```

2. **Monitor Complaint Rate**
   ```bash
   aws cloudwatch put-metric-alarm \
     --alarm-name "SES-High-Complaint-Rate" \
     --alarm-description "Alert when SES complaint rate exceeds 0.1%" \
     --metric-name Reputation.ComplaintRate \
     --namespace AWS/SES \
     --statistic Average \
     --period 86400 \
     --threshold 0.001 \
     --comparison-operator GreaterThanThreshold \
     --evaluation-periods 1 \
     --region us-east-1
   ```

---

## Troubleshooting

### Common Issues

**1. "Email address is not verified"**
- Check SES Console → Verified identities
- Ensure email/domain is verified
- Wait for DNS propagation if using domain verification

**2. "MessageRejected: Email address is not verified"** (Sandbox)
- You're still in SES sandbox mode
- Either verify recipient email or request production access

**3. "Access Denied" when sending email**
- Check IAM role permissions for `ses:SendEmail`
- Verify the instance/App Runner role has the policy attached

**4. Email not received**
- Check spam folder
- Check SES sending statistics in console
- Look for bounce/complaint notifications
- Check CloudWatch logs for errors

**5. Parameter Store not loading**
- Verify parameter exists: `aws ssm get-parameter --name "/swissai-tax/email/sender"`
- Check IAM permissions for `ssm:GetParameter`
- Ensure region matches (`us-east-1`)

### Viewing Logs

```bash
# Backend logs (adjust path based on deployment)
tail -f /var/log/swissai-tax/backend.log

# Or with docker
docker logs -f <container_name>
```

Look for:
```
INFO: SES client initialized for region: us-east-1
INFO: Password reset email sent to user@example.com. MessageId: xxxxx
```

---

## Local Development Setup

For local testing without AWS SES:

1. **Set environment variable**
   ```bash
   export SES_SENDER_EMAIL="test@example.com"
   ```

2. **Use SES Sandbox** with verified test emails

3. **Or use alternative email service** (EmailJS, etc.) by modifying the service

---

## Production Checklist

- [ ] Domain verified in SES
- [ ] Moved out of SES sandbox
- [ ] Parameter Store configured (`/swissai-tax/email/sender`)
- [ ] IAM permissions configured for App Runner/EC2
- [ ] CloudWatch alarms set up
- [ ] Test email sent successfully
- [ ] Frontend routes working (`/forgot-password`, `/reset-password`)
- [ ] End-to-end password reset flow tested

---

## Additional Resources

- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [SES Sending Limits](https://docs.aws.amazon.com/ses/latest/dg/manage-sending-quotas.html)
- [Best Practices for SES](https://docs.aws.amazon.com/ses/latest/dg/best-practices.html)
