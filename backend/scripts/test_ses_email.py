#!/usr/bin/env python3
"""
Test AWS SES email sending for SwissAI Tax
Tests both contact form and password reset emails
"""
import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from services.ses_emailjs_replacement import EmailService

async def test_contact_email():
    """Test contact form email"""
    print("\n" + "="*60)
    print("🧪 Testing Contact Form Email")
    print("="*60)

    email_service = EmailService()

    # Test data
    form_data = {
        'firstName': 'Test',
        'lastName': 'User',
        'email': 'test@example.com',
        'phone': '+41 79 123 45 67',
        'subject': 'Test Contact Form from SES Setup Script',
        'message': 'This is a test message to verify AWS SES configuration. '
                   'If you receive this email, your SES setup is working correctly!',
        'inquiry': 'general'
    }

    print(f"\n📧 Sending test contact form email...")
    print(f"   From: noreply@swissai.tax")
    print(f"   To: contact@swissai.tax")
    print(f"   Subject: Contact Form: {form_data['subject']}")

    try:
        result = await email_service.send_contact_form_email(form_data)

        if result['status'] == 'success':
            print(f"\n✅ SUCCESS!")
            print(f"   MessageId: {result.get('message_id', 'N/A')}")
            print(f"\n📬 Check inbox for: contact@swissai.tax")
            print(f"   Look for email from: noreply@swissai.tax")
            return True
        else:
            print(f"\n❌ FAILED!")
            print(f"   Error: {result.get('message', 'Unknown error')}")
            print(f"   Status Code: {result.get('status_code', 'N/A')}")
            return False

    except Exception as e:
        print(f"\n❌ EXCEPTION!")
        print(f"   Error: {str(e)}")
        return False


async def test_password_reset_email():
    """Test password reset email"""
    print("\n" + "="*60)
    print("🧪 Testing Password Reset Email")
    print("="*60)

    email_service = EmailService()

    # Test data
    test_email = "test@example.com"  # Change to your email for testing
    reset_link = "https://swissai.tax/reset-password?token=test-token-12345"

    print(f"\n📧 Sending test password reset email...")
    print(f"   From: noreply@swissai.tax")
    print(f"   To: {test_email}")
    print(f"   Subject: Reset Your SwissAI Tax Password")

    try:
        result = await email_service.send_password_reset_email(test_email, reset_link)

        if result['status'] == 'success':
            print(f"\n✅ SUCCESS!")
            print(f"   MessageId: {result.get('message_id', 'N/A')}")
            print(f"\n📬 Check inbox for: {test_email}")
            print(f"   Look for email from: noreply@swissai.tax")
            return True
        else:
            print(f"\n❌ FAILED!")
            print(f"   Error: {result.get('message', 'Unknown error')}")
            print(f"   Status Code: {result.get('status_code', 'N/A')}")
            return False

    except Exception as e:
        print(f"\n❌ EXCEPTION!")
        print(f"   Error: {str(e)}")
        return False


async def check_ses_configuration():
    """Check SES configuration"""
    print("\n" + "="*60)
    print("🔍 Checking SES Configuration")
    print("="*60)

    from config import settings

    print(f"\n📋 Current Configuration:")
    print(f"   AWS_REGION: {getattr(settings, 'AWS_REGION', 'NOT SET')}")
    print(f"   SES_SENDER_EMAIL: {getattr(settings, 'SES_SENDER_EMAIL', 'NOT SET')}")
    print(f"   AWS_ACCESS_KEY_ID: {'***' + settings.AWS_ACCESS_KEY_ID[-4:] if hasattr(settings, 'AWS_ACCESS_KEY_ID') and settings.AWS_ACCESS_KEY_ID else 'NOT SET'}")

    # Check if credentials are set
    if not hasattr(settings, 'AWS_ACCESS_KEY_ID') or not settings.AWS_ACCESS_KEY_ID:
        print(f"\n⚠️  WARNING: AWS credentials not configured!")
        print(f"   Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY")
        return False

    return True


async def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("🚀 AWS SES Email Testing Suite for SwissAI Tax")
    print("="*60)

    # Check configuration first
    config_ok = await check_ses_configuration()

    if not config_ok:
        print("\n" + "="*60)
        print("❌ Configuration check failed. Please fix and try again.")
        print("="*60)
        return

    # Run tests
    results = []

    print("\n" + "="*60)
    print("📝 Running Tests...")
    print("="*60)

    # Test 1: Contact form email
    contact_result = await test_contact_email()
    results.append(("Contact Form Email", contact_result))

    # Test 2: Password reset email (optional - comment out if not needed)
    # Uncomment the lines below to test password reset emails
    # reset_result = await test_password_reset_email()
    # results.append(("Password Reset Email", reset_result))

    # Summary
    print("\n" + "="*60)
    print("📊 Test Summary")
    print("="*60)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name}: {status}")

    all_passed = all(result for _, result in results)

    print("\n" + "="*60)
    if all_passed:
        print("🎉 All tests passed! SES is configured correctly.")
    else:
        print("⚠️  Some tests failed. Check errors above.")
    print("="*60)

    # Additional troubleshooting tips
    if not all_passed:
        print("\n💡 Troubleshooting Tips:")
        print("   1. Check AWS SES Console for verified identities")
        print("   2. Verify you're in correct AWS region (eu-central-1)")
        print("   3. If in sandbox mode, verify recipient emails")
        print("   4. Check AWS credentials are correct")
        print("   5. Review AWS SES sending limits")
        print("\n📚 See: backend/docs/AWS_SES_SETUP_GUIDE.md")


if __name__ == "__main__":
    asyncio.run(main())
