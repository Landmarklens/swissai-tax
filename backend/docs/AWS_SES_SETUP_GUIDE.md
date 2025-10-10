# AWS SES Setup Guide for SwissAI Tax
**Complete guide to configure Amazon Simple Email Service (SES) for SwissAI Tax**

---

## 📋 Overview

SwissAI Tax uses AWS SES to send emails for:
- Contact form submissions → `contact@swissai.tax`
- Password reset emails → Users
- System notifications

**Email Addresses Needed:**
- **Sender**: `noreply@swissai.tax` (sends all emails)
- **Recipient**: `contact@swissai.tax` (receives contact form submissions)

---

## 🎯 Implementation Steps

### **OPTION A: Domain Verification (Recommended for Production)**
This allows you to send from ANY email address at `swissai.tax`

### **OPTION B: Individual Email Verification (Quick Start)**
Verify each email address individually (good for testing)

---

## 🚀 OPTION A: Domain Verification (Recommended)

### **Step 1: Access AWS SES Console**

1. Log into AWS Console: https://console.aws.amazon.com/
2. Navigate to **SES** (Simple Email Service)
   - Search "SES" in the top search bar
   - OR go to: https://console.aws.amazon.com/ses/
3. **Select the correct region**: `eu-central-1` (Frankfurt) or your preferred EU region
   - Click region dropdown in top-right
   - SwissAI Tax should use EU region for GDPR compliance

---

### **Step 2: Verify Domain (swissai.tax)**

1. In SES Console, go to **Configuration** → **Verified identities**
2. Click **Create identity** button
3. Select **Domain** as identity type
4. Enter domain: `swissai.tax`
5. **Configuration options**:
   - ✅ Check "Use a custom MAIL FROM domain" (optional but recommended)
   - ✅ Check "Enable DKIM signing"
   - Identity type: Domain
6. Click **Create identity**

---

### **Step 3: Add DNS Records**

AWS will provide DNS records that you must add to your domain's DNS settings.

**You'll need to add these records to your DNS provider (e.g., Cloudflare, Route 53, GoDaddy):**

#### **A. DKIM Records (3 CNAME records)**
```
Name: xxxxxxxx._domainkey.swissai.tax
Type: CNAME
Value: xxxxxxxx.dkim.amazonses.com

Name: yyyyyyyy._domainkey.swissai.tax
Type: CNAME
Value: yyyyyyyy.dkim.amazonses.com

Name: zzzzzzzz._domainkey.swissai.tax
Type: CNAME
Value: zzzzzzzz.dkim.amazonses.com
```

#### **B. Domain Verification Record (1 TXT record)**
```
Name: _amazonses.swissai.tax
Type: TXT
Value: "xxxxxxxxxxxxxxxxxxxxxxxxx"
```

#### **C. MX Record for MAIL FROM domain (if enabled)**
```
Name: bounce.swissai.tax (or mail.swissai.tax)
Type: MX
Priority: 10
Value: feedback-smtp.eu-central-1.amazonses.com
```

#### **D. SPF Record for MAIL FROM domain**
```
Name: bounce.swissai.tax
Type: TXT
Value: "v=spf1 include:amazonses.com ~all"
```

---

### **Step 4: Wait for DNS Propagation**

1. DNS records can take **15 minutes to 48 hours** to propagate
2. Check verification status in SES Console:
   - Go to **Verified identities**
   - Look for `swissai.tax`
   - Status should change from "Pending" to "Verified" (green checkmark)

**Check DNS propagation:**
```bash
# Check DKIM records
dig _domainkey.swissai.tax CNAME

# Check verification TXT record
dig _amazonses.swissai.tax TXT
```

---

### **Step 5: Test Domain Verification**

Once verified, you can send from ANY email at `@swissai.tax`:
- `noreply@swissai.tax` ✅
- `contact@swissai.tax` ✅
- `support@swissai.tax` ✅
- `info@swissai.tax` ✅

---

## 🎯 OPTION B: Individual Email Verification (Quick Start)

Use this for testing or if you can't access DNS settings.

### **Step 1: Verify noreply@swissai.tax (Sender)**

1. In SES Console, go to **Configuration** → **Verified identities**
2. Click **Create identity**
3. Select **Email address** as identity type
4. Enter: `noreply@swissai.tax`
5. Click **Create identity**
6. **Check the email inbox** for `noreply@swissai.tax`
7. Click the verification link in the email from AWS
8. Email status will change to "Verified"

---

### **Step 2: Verify contact@swissai.tax (Recipient)**

**ONLY needed if SES is in SANDBOX mode**

1. Repeat Step 1 for `contact@swissai.tax`
2. Check inbox for `contact@swissai.tax`
3. Click verification link
4. Status changes to "Verified"

---

## 🏖️ Moving Out of SES Sandbox Mode

**Sandbox Limitations:**
- ❌ Can only send to verified email addresses
- ❌ Limited to 200 emails per day
- ❌ 1 email per second rate limit

**Production Mode:**
- ✅ Send to ANY email address
- ✅ Higher sending limits (50,000+ emails/day)
- ✅ Better reputation management

---

### **Request Production Access**

1. In SES Console, go to **Account dashboard**
2. Look for banner: "Your account is in the sandbox"
3. Click **Request production access** button
4. Fill out the form:

**Use Case Details:**
```
Email Type: Transactional
Website URL: https://swissai.tax
Use Case Description:
"SwissAI Tax is a Swiss tax filing platform. We send:
1. Contact form notifications to contact@swissai.tax
2. Password reset emails to registered users
3. Account verification emails
All emails are solicited and transactional. Users explicitly
request these emails through our platform."

Additional Information:
"We have proper unsubscribe mechanisms and comply with GDPR.
Expected volume: < 1,000 emails/month
We use double opt-in for user registrations."
```

**Compliance:**
- ✅ Will only send to recipients who have requested emails
- ✅ Have process to handle bounces and complaints
- ✅ Complies with AWS Acceptable Use Policy

5. Submit request
6. Wait for AWS approval (usually **24-48 hours**)
7. You'll receive email when approved

---

## 🔧 Configuration in SwissAI Tax Backend

### **Step 1: Verify Settings**

Check `backend/config/settings.py`:

```python
# AWS SES Configuration
AWS_REGION = "eu-central-1"  # Or your SES region
AWS_ACCESS_KEY_ID = "your-access-key-id"
AWS_SECRET_ACCESS_KEY = "your-secret-access-key"
SES_SENDER_EMAIL = "noreply@swissai.tax"
```

---

### **Step 2: Set Environment Variables**

If using Parameter Store, set these parameters:

```bash
aws ssm put-parameter \
  --name "/swissai-tax/prod/AWS_REGION" \
  --value "eu-central-1" \
  --type "String"

aws ssm put-parameter \
  --name "/swissai-tax/prod/SES_SENDER_EMAIL" \
  --value "noreply@swissai.tax" \
  --type "String"

# AWS credentials should already be set
```

---

## 🧪 Testing SES Configuration

### **Test 1: Send Test Email from AWS Console**

1. Go to SES Console → **Verified identities**
2. Click on `swissai.tax` (or `noreply@swissai.tax`)
3. Click **Send test email** button
4. Fill in:
   - **From**: `noreply@swissai.tax`
   - **To**: `contact@swissai.tax` (or your email)
   - **Subject**: "Test from AWS SES"
   - **Body**: "This is a test email"
5. Click **Send test email**
6. Check inbox for `contact@swissai.tax`

---

### **Test 2: Test via Backend Script**

Create test script: `backend/scripts/test_ses_email.py`

```python
#!/usr/bin/env python3
"""
Test AWS SES email sending
"""
import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from services.ses_emailjs_replacement import EmailService

async def test_contact_email():
    """Test contact form email"""
    email_service = EmailService()

    # Test data
    form_data = {
        'firstName': 'Test',
        'lastName': 'User',
        'email': 'test@example.com',
        'phone': '+41 79 123 45 67',
        'subject': 'Test Contact Form',
        'message': 'This is a test message from the SES setup script.',
        'inquiry': 'general'
    }

    print("Sending test contact form email...")
    result = await email_service.send_contact_form_email(form_data)

    if result['status'] == 'success':
        print(f"✅ SUCCESS! Email sent. MessageId: {result['message_id']}")
        print(f"📧 Check inbox for: contact@swissai.tax")
    else:
        print(f"❌ FAILED! Error: {result['message']}")

    return result

if __name__ == "__main__":
    asyncio.run(test_contact_email())
```

**Run test:**
```bash
cd backend
python3 scripts/test_ses_email.py
```

---

### **Test 3: Test via Contact Form**

1. Start frontend: `npm start`
2. Go to: http://localhost:3000/en/contact-us
3. Fill out form with test data
4. Click "Send Message"
5. Check inbox for `contact@swissai.tax`
6. Check backend logs for MessageId

---

## 📊 Monitoring & Troubleshooting

### **Check SES Sending Statistics**

1. Go to SES Console → **Account dashboard**
2. View:
   - Emails sent (last 24h)
   - Bounces
   - Complaints
   - Reputation status

---

### **Common Issues & Solutions**

#### **Issue 1: "Email address is not verified"**

**Error**: `MessageRejected: Email address is not verified`

**Solution**:
- You're in **Sandbox mode**
- Verify the recipient email address
- OR request production access

---

#### **Issue 2: "Daily sending quota exceeded"**

**Error**: `Throttling: Maximum sending rate exceeded`

**Solution**:
- You've hit the 200/day limit (sandbox)
- Request production access
- OR wait 24 hours for quota reset

---

#### **Issue 3: DNS records not propagating**

**Symptoms**: Domain shows "Pending verification" for > 2 hours

**Solution**:
```bash
# Check DNS records
dig _amazonses.swissai.tax TXT +short

# Should return: "verification-code-here"
```

- Verify DNS records are correctly added
- Wait longer (up to 48 hours)
- Check with DNS provider for issues

---

#### **Issue 4: Emails going to spam**

**Solution**:
1. Add **SPF record**:
   ```
   swissai.tax TXT "v=spf1 include:amazonses.com ~all"
   ```

2. Enable **DKIM** (already done in domain verification)

3. Add **DMARC record**:
   ```
   _dmarc.swissai.tax TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@swissai.tax"
   ```

4. Warm up your domain (start with low volume)

---

## 🔐 Security Best Practices

### **1. Use IAM Roles (Not Access Keys)**

For production, use IAM roles instead of access keys:

```python
# In production (App Runner), AWS credentials are automatic
# No need to set AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY
```

### **2. Restrict SES Permissions**

Create IAM policy for SES:

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
      "Resource": "*",
      "Condition": {
        "StringLike": {
          "ses:FromAddress": "noreply@swissai.tax"
        }
      }
    }
  ]
}
```

### **3. Monitor Bounce & Complaint Rates**

- Keep bounce rate < 5%
- Keep complaint rate < 0.1%
- Set up SNS notifications for bounces

---

## 📋 Checklist

### **Initial Setup**
- [ ] AWS SES Console accessed in correct region (eu-central-1)
- [ ] Domain `swissai.tax` verified OR
- [ ] Email `noreply@swissai.tax` verified
- [ ] Email `contact@swissai.tax` verified (if sandbox)
- [ ] DNS records added (if domain verification)
- [ ] DNS propagation confirmed

### **Configuration**
- [ ] `SES_SENDER_EMAIL = "noreply@swissai.tax"` in settings
- [ ] AWS credentials configured
- [ ] AWS_REGION set correctly

### **Production Readiness**
- [ ] Requested production access
- [ ] Production access approved
- [ ] SPF record added
- [ ] DKIM enabled and verified
- [ ] DMARC record added (optional but recommended)

### **Testing**
- [ ] Test email sent from AWS Console
- [ ] Test script executed successfully
- [ ] Contact form tested (frontend → backend → email)
- [ ] Email received at `contact@swissai.tax`
- [ ] Email not in spam folder

---

## 📞 Support Resources

- **AWS SES Documentation**: https://docs.aws.amazon.com/ses/
- **SES Sandbox FAQ**: https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html
- **DNS Verification**: https://docs.aws.amazon.com/ses/latest/dg/creating-identities.html
- **AWS Support**: https://console.aws.amazon.com/support/

---

## 🎉 Success Criteria

You've successfully configured SES when:

✅ Domain/emails show "Verified" in SES Console
✅ Test email sent successfully from AWS Console
✅ Backend test script sends email without errors
✅ Contact form submissions arrive at `contact@swissai.tax`
✅ Emails have proper DKIM signatures
✅ Emails don't go to spam
✅ Production access granted (for unlimited sending)

---

**Last Updated**: 2024-10-10
**Maintained By**: SwissAI Tax DevOps Team
