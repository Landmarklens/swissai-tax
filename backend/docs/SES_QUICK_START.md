# AWS SES Quick Start Guide

**Get SwissAI Tax email working in 5 minutes**

---

## 🚀 Quick Setup (Web Console Method)

### **Step 1: Open AWS SES Console**
```
https://console.aws.amazon.com/ses/home?region=eu-central-1
```

### **Step 2: Verify Sender Email**

1. Click **Verified identities** → **Create identity**
2. Select **Email address**
3. Enter: `noreply@swissai.tax`
4. Click **Create identity**
5. Check inbox for `noreply@swissai.tax`
6. Click verification link in email

### **Step 3: Verify Recipient Email (Sandbox Only)**

1. Click **Create identity** again
2. Select **Email address**
3. Enter: `contact@swissai.tax`
4. Click **Create identity**
5. Check inbox for `contact@swissai.tax`
6. Click verification link in email

### **Step 4: Test It**

```bash
cd backend
python3 scripts/test_ses_email.py
```

**Done!** Check `contact@swissai.tax` inbox.

---

## 🛠️ CLI Method (Faster)

### **Prerequisites**
```bash
# Install AWS CLI if not installed
brew install awscli  # macOS
# OR: pip install awscli

# Configure credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region (eu-central-1)
```

### **Run Setup Helper**
```bash
cd backend/scripts
./ses_setup_helper.sh
```

**Select options:**
- Option 2: Verify noreply@swissai.tax
- Option 3: Verify contact@swissai.tax
- Option 7: Run test script

---

## 📧 Email Addresses

| Email | Purpose | Status |
|-------|---------|--------|
| `noreply@swissai.tax` | Sender (all outgoing emails) | ⚠️ Must verify |
| `contact@swissai.tax` | Recipient (contact form) | ⚠️ Must verify (sandbox) |

---

## ⚡ Common Commands

### **Check Verification Status**
```bash
aws ses get-identity-verification-attributes \
  --identities noreply@swissai.tax contact@swissai.tax \
  --region eu-central-1
```

### **Send Test Email**
```bash
aws ses send-email \
  --from noreply@swissai.tax \
  --to contact@swissai.tax \
  --subject "Test" \
  --text "Test message" \
  --region eu-central-1
```

### **Run Backend Test**
```bash
cd backend
python3 scripts/test_ses_email.py
```

---

## 🐛 Troubleshooting

### **Error: "Email address is not verified"**
→ Verify both `noreply@swissai.tax` AND `contact@swissai.tax`

### **Error: "Daily sending quota exceeded"**
→ You're in sandbox mode (200 emails/day limit)
→ Request production access (see full guide)

### **Emails not arriving**
1. Check spam folder
2. Wait 5 minutes (AWS delay)
3. Check AWS SES Console for errors
4. Run: `aws ses get-send-statistics --region eu-central-1`

---

## 🎯 Next Steps

### **For Production Use:**

1. **Request Production Access**
   - AWS Console → SES → Account Dashboard
   - Click "Request production access"
   - Fill form (see full guide for template)
   - Wait 24-48 hours for approval

2. **Verify Domain (Recommended)**
   - Allows sending from ANY @swissai.tax email
   - No need to verify each email individually
   - See: `AWS_SES_SETUP_GUIDE.md` Section "Domain Verification"

3. **Add DNS Records**
   - SPF: Prevent spoofing
   - DKIM: Email authentication
   - DMARC: Email policy

---

## 📚 Full Documentation

**Detailed guide**: `backend/docs/AWS_SES_SETUP_GUIDE.md`

**Includes:**
- Domain verification steps
- DNS configuration
- Production access request
- SPF/DKIM/DMARC setup
- Monitoring & troubleshooting
- Security best practices

---

## ✅ Checklist

- [ ] AWS CLI installed and configured
- [ ] noreply@swissai.tax verified
- [ ] contact@swissai.tax verified (if sandbox)
- [ ] Test email sent successfully
- [ ] Test script runs without errors
- [ ] Contact form works (frontend test)
- [ ] Production access requested (optional)

---

**Need help?** See `AWS_SES_SETUP_GUIDE.md` for detailed instructions.
