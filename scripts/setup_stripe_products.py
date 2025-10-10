#!/usr/bin/env python3
"""
Stripe Product Setup Script
Creates all required Stripe products and prices for SwissAI Tax

Usage:
    python scripts/setup_stripe_products.py --mode test
    python scripts/setup_stripe_products.py --mode live

This will:
1. Create 3 products (Basic, Pro, Premium)
2. Create annual recurring prices in CHF
3. Output Price IDs for AWS Parameter Store
4. Create webhook endpoint
"""

import argparse
import os
import sys
from typing import Dict, List

try:
    import stripe
except ImportError:
    print("ERROR: stripe package not installed")
    print("Run: pip install stripe")
    sys.exit(1)


def create_product_and_price(
    name: str,
    description: str,
    price_chf: int,
    plan_type: str,
    metadata: Dict[str, str] = None
) -> Dict[str, str]:
    """Create a Stripe product and annual recurring price"""

    # Prepare metadata
    product_metadata = metadata or {}
    product_metadata['plan_type'] = plan_type

    # Create product
    print(f"\n📦 Creating product: {name}...")
    product = stripe.Product.create(
        name=name,
        description=description,
        metadata=product_metadata
    )
    print(f"   ✅ Product created: {product.id}")

    # Create annual recurring price
    print(f"   💰 Creating price: CHF {price_chf}/year...")
    price = stripe.Price.create(
        product=product.id,
        currency='chf',
        unit_amount=price_chf * 100,  # Convert to cents
        recurring={
            'interval': 'year',
            'interval_count': 1
        },
        metadata={'plan_type': plan_type}
    )
    print(f"   ✅ Price created: {price.id}")

    return {
        'product_id': product.id,
        'price_id': price.id,
        'plan_type': plan_type,
        'name': name,
        'price_chf': price_chf
    }


def create_webhook_endpoint(api_url: str, mode: str) -> Dict[str, str]:
    """Create Stripe webhook endpoint"""

    webhook_url = f"{api_url}/api/webhooks/stripe"

    print(f"\n🔗 Creating webhook endpoint: {webhook_url}...")

    # Events to listen for
    enabled_events = [
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'customer.subscription.trial_will_end',
        'invoice.payment_succeeded',
        'invoice.payment_failed',
        'payment_intent.succeeded',
        'payment_intent.payment_failed',
    ]

    try:
        webhook = stripe.WebhookEndpoint.create(
            url=webhook_url,
            enabled_events=enabled_events,
            description=f"SwissAI Tax - {mode.upper()} mode"
        )

        print(f"   ✅ Webhook created: {webhook.id}")
        print(f"   📝 Signing secret: {webhook.secret}")

        return {
            'webhook_id': webhook.id,
            'webhook_secret': webhook.secret
        }
    except stripe.error.InvalidRequestError as e:
        if 'already exists' in str(e):
            print(f"   ⚠️  Webhook already exists for {webhook_url}")
            print(f"   ℹ️  Go to Stripe Dashboard to get the signing secret")
            return {
                'webhook_id': None,
                'webhook_secret': None
            }
        raise


def setup_stripe_products(mode: str, api_url: str):
    """Main setup function"""

    # Get Stripe API key from environment
    api_key_var = 'STRIPE_SECRET_KEY_TEST' if mode == 'test' else 'STRIPE_SECRET_KEY_LIVE'
    api_key = os.getenv(api_key_var)

    if not api_key:
        print(f"ERROR: {api_key_var} environment variable not set")
        print(f"\nSet it with:")
        print(f"export {api_key_var}=sk_{mode}_YOUR_KEY_HERE")
        sys.exit(1)

    # Configure Stripe
    stripe.api_key = api_key

    print("=" * 80)
    print(f"🚀 SwissAI Tax - Stripe Product Setup ({mode.upper()} mode)")
    print("=" * 80)

    # Create products
    products = []

    # 1. Basic Plan
    basic = create_product_and_price(
        name='SwissAI Tax - Basic',
        description='Complete tax filing with AI guidance',
        price_chf=49,
        plan_type='basic',
        metadata={'tier': '1'}
    )
    products.append(basic)

    # 2. Pro Plan (Most Popular)
    pro = create_product_and_price(
        name='SwissAI Tax - Pro',
        description='Optimize your taxes with AI-powered insights',
        price_chf=99,
        plan_type='pro',
        metadata={'tier': '2', 'popular': 'true'}
    )
    products.append(pro)

    # 3. Premium Plan
    premium = create_product_and_price(
        name='SwissAI Tax - Premium',
        description='Professional-grade with expert review',
        price_chf=149,
        plan_type='premium',
        metadata={'tier': '3'}
    )
    products.append(premium)

    # Create webhook
    webhook_info = create_webhook_endpoint(api_url, mode)

    # Print summary
    print("\n" + "=" * 80)
    print("✅ SETUP COMPLETE!")
    print("=" * 80)

    print("\n📋 PRODUCT SUMMARY:")
    print("-" * 80)
    for product in products:
        print(f"  {product['name']}")
        print(f"    Plan Type:  {product['plan_type']}")
        print(f"    Price:      CHF {product['price_chf']}/year")
        print(f"    Product ID: {product['product_id']}")
        print(f"    Price ID:   {product['price_id']}")
        print()

    # Output AWS Parameter Store commands
    print("\n📝 AWS PARAMETER STORE COMMANDS:")
    print("-" * 80)
    print("Copy and run these commands to configure AWS Parameter Store:\n")

    print(f"# Stripe API Keys ({mode} mode)")
    print(f"aws ssm put-parameter \\")
    print(f"  --name '/swissai-tax/stripe/secret-key' \\")
    print(f"  --value '{api_key[:20]}...' \\")
    print(f"  --type 'SecureString' \\")
    print(f"  --region us-east-1 \\")
    print(f"  --overwrite\n")

    # Get publishable key hint
    pub_key_prefix = 'pk_test_' if mode == 'test' else 'pk_live_'
    print(f"aws ssm put-parameter \\")
    print(f"  --name '/swissai-tax/stripe/publishable-key' \\")
    print(f"  --value '{pub_key_prefix}YOUR_PUBLISHABLE_KEY_HERE' \\")
    print(f"  --type 'String' \\")
    print(f"  --region us-east-1 \\")
    print(f"  --overwrite\n")

    if webhook_info['webhook_secret']:
        print(f"aws ssm put-parameter \\")
        print(f"  --name '/swissai-tax/stripe/webhook-secret' \\")
        print(f"  --value '{webhook_info['webhook_secret']}' \\")
        print(f"  --type 'SecureString' \\")
        print(f"  --region us-east-1 \\")
        print(f"  --overwrite\n")

    print(f"# Price IDs")
    for product in products:
        print(f"aws ssm put-parameter \\")
        print(f"  --name '/swissai-tax/stripe/price-{product['plan_type']}' \\")
        print(f"  --value '{product['price_id']}' \\")
        print(f"  --type 'String' \\")
        print(f"  --region us-east-1 \\")
        print(f"  --overwrite\n")

    print(f"# Enable subscriptions feature flag")
    print(f"aws ssm put-parameter \\")
    print(f"  --name '/swissai-tax/features/enable-subscriptions' \\")
    print(f"  --value 'true' \\")
    print(f"  --type 'String' \\")
    print(f"  --region us-east-1 \\")
    print(f"  --overwrite\n")

    # Output script for easy copying
    print("\n💾 SAVING CONFIGURATION SCRIPT...")
    script_filename = f'configure_aws_params_{mode}.sh'

    with open(script_filename, 'w') as f:
        f.write("#!/bin/bash\n")
        f.write(f"# AWS Parameter Store configuration for SwissAI Tax ({mode} mode)\n")
        f.write(f"# Generated by setup_stripe_products.py\n\n")
        f.write("set -e\n\n")

        f.write(f"echo 'Configuring AWS Parameter Store for {mode} mode...'\n\n")

        # Stripe keys
        f.write(f"# Stripe API Keys\n")
        f.write(f"aws ssm put-parameter \\\n")
        f.write(f"  --name '/swissai-tax/stripe/secret-key' \\\n")
        f.write(f"  --value '{api_key}' \\\n")
        f.write(f"  --type 'SecureString' \\\n")
        f.write(f"  --region us-east-1 \\\n")
        f.write(f"  --overwrite\n\n")

        f.write(f"# TODO: Get publishable key from Stripe Dashboard\n")
        f.write(f"# aws ssm put-parameter \\\n")
        f.write(f"#   --name '/swissai-tax/stripe/publishable-key' \\\n")
        f.write(f"#   --value '{pub_key_prefix}YOUR_KEY_HERE' \\\n")
        f.write(f"#   --type 'String' \\\n")
        f.write(f"#   --region us-east-1 \\\n")
        f.write(f"#   --overwrite\n\n")

        if webhook_info['webhook_secret']:
            f.write(f"# Webhook Secret\n")
            f.write(f"aws ssm put-parameter \\\n")
            f.write(f"  --name '/swissai-tax/stripe/webhook-secret' \\\n")
            f.write(f"  --value '{webhook_info['webhook_secret']}' \\\n")
            f.write(f"  --type 'SecureString' \\\n")
            f.write(f"  --region us-east-1 \\\n")
            f.write(f"  --overwrite\n\n")

        # Price IDs
        f.write(f"# Price IDs\n")
        for product in products:
            f.write(f"aws ssm put-parameter \\\n")
            f.write(f"  --name '/swissai-tax/stripe/price-{product['plan_type']}' \\\n")
            f.write(f"  --value '{product['price_id']}' \\\n")
            f.write(f"  --type 'String' \\\n")
            f.write(f"  --region us-east-1 \\\n")
            f.write(f"  --overwrite\n\n")

        # Feature flag
        f.write(f"# Enable subscriptions\n")
        f.write(f"aws ssm put-parameter \\\n")
        f.write(f"  --name '/swissai-tax/features/enable-subscriptions' \\\n")
        f.write(f"  --value 'true' \\\n")
        f.write(f"  --type 'String' \\\n")
        f.write(f"  --region us-east-1 \\\n")
        f.write(f"  --overwrite\n\n")

        f.write(f"echo 'Configuration complete!'\n")

    os.chmod(script_filename, 0o755)
    print(f"   ✅ Saved to: {script_filename}")
    print(f"   Run with: ./{script_filename}\n")

    # Output .env content
    print("\n📝 FRONTEND .env FILE:")
    print("-" * 80)
    pub_key_example = f"{pub_key_prefix}...get_from_stripe_dashboard..."
    print(f"REACT_APP_STRIPE_PUBLISHABLE_KEY={pub_key_example}\n")

    print("\n✅ Next Steps:")
    print("-" * 80)
    print("1. Get your publishable key from Stripe Dashboard → Developers → API keys")
    print(f"2. Update the publishable key in: {script_filename}")
    print(f"3. Run the configuration script: ./{script_filename}")
    print("4. Add REACT_APP_STRIPE_PUBLISHABLE_KEY to frontend .env")
    print("5. Run database migrations: cd backend && alembic upgrade head")
    print("6. Restart backend to load new configuration")
    print("7. Test with Stripe test card: 4242 4242 4242 4242")
    print()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Setup Stripe products for SwissAI Tax')
    parser.add_argument(
        '--mode',
        choices=['test', 'live'],
        required=True,
        help='Stripe mode: test or live'
    )
    parser.add_argument(
        '--api-url',
        default='https://api.swissai.tax',
        help='API URL for webhook endpoint (default: https://api.swissai.tax)'
    )

    args = parser.parse_args()

    # Confirmation for live mode
    if args.mode == 'live':
        print("⚠️  WARNING: You are about to create products in LIVE mode")
        print("   This will create real products that can charge real money.")
        response = input("   Are you sure? (yes/no): ")
        if response.lower() != 'yes':
            print("Aborted.")
            sys.exit(0)

    setup_stripe_products(args.mode, args.api_url)
