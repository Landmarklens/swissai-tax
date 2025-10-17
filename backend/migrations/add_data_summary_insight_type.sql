-- Migration: Add DATA_SUMMARY to InsightType enum
-- Date: 2025-10-17
-- Description: Add new data_summary value to insighttype enum for data-focused insights
-- IDEMPOTENT: Safe to run multiple times

-- Check if the enum value already exists before adding it
DO $$
BEGIN
    -- Check if 'data_summary' already exists in the enum
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'insighttype'
        AND e.enumlabel = 'data_summary'
    ) THEN
        -- Add the new enum value
        ALTER TYPE swisstax.insighttype ADD VALUE 'data_summary';
        RAISE NOTICE 'Added data_summary to insighttype enum';
    ELSE
        RAISE NOTICE 'data_summary already exists in insighttype enum - skipping';
    END IF;
END$$;

-- Verify the migration
DO $$
DECLARE
    enum_values TEXT;
BEGIN
    SELECT string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder)
    INTO enum_values
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'insighttype';

    RAISE NOTICE 'Current insighttype enum values: %', enum_values;
END$$;
