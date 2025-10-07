# WorkMail Setup for noreply@swissai.tax

## Current Status

✅ **WorkMail organization:** homeai (m-d2d3200f97f644f49073831ded36e583)
✅ **Domain added:** swissai.tax
✅ **User created:** noreply (ID: a3a0bfc5-9db6-4114-89af-d2959f4ae7f3)
⏳ **DNS verification:** PENDING (required before email can be used)

---

## Option 1: Complete WorkMail Setup (Requires DNS Access)

### DNS Records Required

You need to add these DNS records to your `swissai.tax` domain:

#### 1. MX Record (Mail Exchange)
```
Type: MX
Name: @  (or swissai.tax)
Value: 10 inbound-smtp.us-east-1.amazonaws.com
TTL: 3600
```

#### 2. TXT Record (Domain Verification)
```
Type: TXT
Name: _amazonses
Value: J7OF45TAQf4h4q9SKen3uEhjKMR1kAgZqSrahZXZGQY=
TTL: 3600
```

#### 3. SPF Record
```
Type: TXT
Name: @  (or swissai.tax)
Value: v=spf1 include:amazonses.com ~all
TTL: 3600
```

#### 4. DMARC Record
```
Type: TXT
Name: _dmarc
Value: v=DMARC1;p=quarantine;pct=100;fo=1
TTL: 3600
```

#### 5. DKIM Records (3 CNAME records)
```
Type: CNAME
Name: yaa66bwsaziea24tnmobqyh6nvzcygxr._domainkey
Value: yaa66bwsaziea24tnmobqyh6nvzcygxr.dkim.amazonses.com
TTL: 3600

Type: CNAME
Name: jpby3lwr7oqo7g7ttlt7nz2fzqpc3eff._domainkey
Value: jpby3lwr7oqo7g7ttlt7nz2fzqpc3eff.dkim.amazonses.com
TTL: 3600

Type: CNAME
Name: sxjz7dwdbbycuidsvfjj7tjcaxm7bom7._domainkey
Value: sxjz7dwdbbycuidsvfjj7tjcaxm7bom7.dkim.amazonses.com
TTL: 3600
```

#### 6. Autodiscover Record
```
Type: CNAME
Name: autodiscover
Value: autodiscover.mail.us-east-1.awsapps.com
TTL: 3600
```

### After Adding DNS Records

1. **Wait for DNS propagation** (can take up to 72 hours, usually < 1 hour)

2. **Check verification status:**
   ```bash
   aws workmail get-mail-domain \
     --organization-id "m-d2d3200f97f644f49073831ded36e583" \
     --domain-name "swissai.tax" \
     --region us-east-1 \
     --query 'OwnershipVerificationStatus' \
     --output text
   ```

3. **Once verified, register the email:**
   ```bash
   aws workmail register-to-work-mail \
     --organization-id "m-d2d3200f97f644f49073831ded36e583" \
     --entity-id "a3a0bfc5-9db6-4114-89af-d2959f4ae7f3" \
     --email "noreply@swissai.tax" \
     --region us-east-1
   ```

4. **Access the mailbox via:**
   - Web: https://homeai.awsapps.com/mail
   - Username: noreply@swissai.tax
   - Password: (Set via AWS Console → WorkMail → Users → Reset Password)

---

## Option 2: Use Existing homeai.ch Domain (FASTER)

Since you already have `homeai.ch` verified in WorkMail, we can use that instead:

### Quick Setup (5 minutes)

1. **Create email alias:**
   ```bash
   aws workmail register-to-work-mail \
     --organization-id "m-d2d3200f97f644f49073831ded36e583" \
     --entity-id "a3a0bfc5-9db6-4114-89af-d2959f4ae7f3" \
     --email "noreply@homeai.ch" \
     --region us-east-1
   ```

2. **Update SES verification:**
   ```bash
   # Cancel swissai.tax verification
   aws ses delete-identity --identity noreply@swissai.tax --region us-east-1

   # Verify homeai.ch email
   aws ses verify-email-identity --email-address noreply@homeai.ch --region us-east-1
   ```

3. **Update Parameter Store:**
   ```bash
   aws ssm put-parameter \
     --name "/swissai-tax/email/sender" \
     --value "noreply@homeai.ch" \
     --type "String" \
     --region us-east-1 \
     --overwrite
   ```

4. **Check WorkMail inbox:**
   - Go to: https://homeai.awsapps.com/mail
   - Login as: noreply@homeai.ch
   - Click SES verification link

**Done!** Email ready to use immediately.

---

## Option 3: Use Simple Email (No WorkMail)

If you don't need a full mailbox, just use an existing email you can access:

```bash
# Use your personal/work email
aws ses verify-email-identity --email-address YOUR_EMAIL@gmail.com --region us-east-1

# Update Parameter Store
aws ssm put-parameter \
  --name "/swissai-tax/email/sender" \
  --value "YOUR_EMAIL@gmail.com" \
  --region us-east-1 \
  --overwrite
```

**Note:** SES can send FROM any verified email, even if it's not your domain.

---

## Recommended Approach

**For Production:** Use Option 1 (swissai.tax with WorkMail)
- Professional sender address
- Full mailbox for bounce/reply handling
- Better deliverability

**For Quick Testing:** Use Option 2 (homeai.ch)
- Works immediately
- Can migrate to swissai.tax later

**For Development:** Use Option 3 (personal email)
- Fastest setup
- Good for testing only

---

## Cost Comparison

| Option | Setup Time | Monthly Cost | Professionalism |
|--------|------------|--------------|-----------------|
| Option 1 (swissai.tax WorkMail) | 1-72 hours | $4/user | ⭐⭐⭐⭐⭐ |
| Option 2 (homeai.ch WorkMail) | 5 minutes | $4/user | ⭐⭐⭐⭐ |
| Option 3 (Personal email) | 2 minutes | $0 | ⭐⭐ |

**WorkMail Pricing:** $4/user/month for mailbox access

---

## Next Steps

**Choose one option and let me know:**

1. **"Use swissai.tax"** - I'll guide you through DNS setup
2. **"Use homeai.ch"** - I'll complete the setup immediately
3. **"Use my email: xyz@example.com"** - I'll configure SES with your email

Which would you prefer?
