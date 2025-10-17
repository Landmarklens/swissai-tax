-- Migration: Add missing enum values for insight_type and priority
-- Date: 2025-10-17
-- Description: Ensure all enum values exist in database (idempotent)

-- ============================================================
-- Add missing insightpriority enum values if they don't exist
-- ============================================================
DO $$
BEGIN
    -- Check and add 'high'
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'insightpriority'
        AND e.enumlabel = 'high'
    ) THEN
        ALTER TYPE swisstax.insightpriority ADD VALUE 'high';
        RAISE NOTICE 'Added high to insightpriority enum';
    ELSE
        RAISE NOTICE 'high already exists in insightpriority enum';
    END IF;

    -- Check and add 'medium'
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'insightpriority'
        AND e.enumlabel = 'medium'
    ) THEN
        ALTER TYPE swisstax.insightpriority ADD VALUE 'medium';
        RAISE NOTICE 'Added medium to insightpriority enum';
    ELSE
        RAISE NOTICE 'medium already exists in insightpriority enum';
    END IF;

    -- Check and add 'low'
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'insightpriority'
        AND e.enumlabel = 'low'
    ) THEN
        ALTER TYPE swisstax.insightpriority ADD VALUE 'low';
        RAISE NOTICE 'Added low to insightpriority enum';
    ELSE
        RAISE NOTICE 'low already exists in insightpriority enum';
    END IF;
END$$;

-- ============================================================
-- Verify all enum values
-- ============================================================
DO $$
DECLARE
    type_values TEXT;
    priority_values TEXT;
    category_values TEXT;
BEGIN
    -- Get insighttype values
    SELECT string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder)
    INTO type_values
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'insighttype';

    -- Get insightpriority values
    SELECT string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder)
    INTO priority_values
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'insightpriority';

    -- Get insightcategory values
    SELECT string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder)
    INTO category_values
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'insightcategory';

    RAISE NOTICE 'insighttype values: %', type_values;
    RAISE NOTICE 'insightpriority values: %', priority_values;
    RAISE NOTICE 'insightcategory values: %', category_values;
END$$;
