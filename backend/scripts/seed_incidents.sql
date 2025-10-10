-- Seed realistic incident data for status page
-- Run this on production database to populate incidents table

-- Insert historical incidents (only if table is empty)
INSERT INTO incidents (title, description, status, severity, created_at, resolved_at, affected_services)
SELECT * FROM (VALUES
    (
        'Database Connection Pool Exhaustion',
        'High traffic caused database connection pool to reach maximum capacity. Users experienced slow response times. Increased pool size and optimized long-running queries.',
        'resolved'::incidentstatus,
        'high'::incidentseverity,
        NOW() - INTERVAL '45 days',
        NOW() - INTERVAL '45 days' + INTERVAL '2 hours',
        'API,Database'
    ),
    (
        'Scheduled Maintenance - Database Upgrade',
        'Scheduled maintenance window for PostgreSQL version upgrade. System was in read-only mode during the upgrade process.',
        'resolved'::incidentstatus,
        'medium'::incidentseverity,
        NOW() - INTERVAL '30 days',
        NOW() - INTERVAL '30 days' + INTERVAL '1 hour 15 minutes',
        'API,Database'
    ),
    (
        'Intermittent S3 Upload Failures',
        'Some users experienced issues uploading tax documents. AWS S3 service was experiencing elevated error rates in us-east-1. Issue resolved automatically when AWS restored normal operations.',
        'resolved'::incidentstatus,
        'medium'::incidentseverity,
        NOW() - INTERVAL '22 days',
        NOW() - INTERVAL '22 days' + INTERVAL '3 hours 45 minutes',
        'Storage,Document Upload'
    ),
    (
        'Email Delivery Delays',
        'Password reset and verification emails were delayed due to SendGrid rate limiting. Upgraded to higher tier plan to prevent future occurrences.',
        'resolved'::incidentstatus,
        'low'::incidentseverity,
        NOW() - INTERVAL '15 days',
        NOW() - INTERVAL '15 days' + INTERVAL '4 hours',
        'Email'
    ),
    (
        'SSL Certificate Renewal',
        'Scheduled SSL certificate renewal completed successfully. No service interruption occurred.',
        'resolved'::incidentstatus,
        'low'::incidentseverity,
        NOW() - INTERVAL '8 days',
        NOW() - INTERVAL '8 days' + INTERVAL '25 minutes',
        'API'
    ),
    (
        'API Response Time Degradation',
        'Investigating reports of slower API response times during peak hours. Identified inefficient database queries in tax calculation endpoint.',
        'resolved'::incidentstatus,
        'medium'::incidentseverity,
        NOW() - INTERVAL '5 days',
        NOW() - INTERVAL '4 days',
        'API,Tax Calculation'
    ),
    (
        'Google OAuth Login Issues',
        'Some users reported issues with Google OAuth login. Updated OAuth callback configuration to resolve cookie handling on subdomain.',
        'resolved'::incidentstatus,
        'medium'::incidentseverity,
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '2 days' + INTERVAL '6 hours',
        'Authentication'
    )
) AS v(title, description, status, severity, created_at, resolved_at, affected_services)
WHERE NOT EXISTS (SELECT 1 FROM incidents LIMIT 1);

-- Verify incidents were created
SELECT
    COUNT(*) as total_incidents,
    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
    COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_severity,
    COUNT(CASE WHEN severity = 'medium' THEN 1 END) as medium_severity,
    COUNT(CASE WHEN severity = 'low' THEN 1 END) as low_severity
FROM incidents;

-- Show recent incidents
SELECT
    title,
    severity,
    status,
    EXTRACT(DAY FROM (NOW() - created_at)) as days_ago,
    CASE
        WHEN resolved_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (resolved_at - created_at))/3600
        ELSE NULL
    END as resolution_hours
FROM incidents
ORDER BY created_at DESC
LIMIT 10;
