-- Belang Rail V2: no schema changes are needed.
-- First export/verify a backup using docs/SETUP.md.
-- Select the existing pis_railway database before running this read-only check.
-- The V2 runtime ignores old feed settings and never ingests on page visits.
-- Disable the OLD application's scheduled fetch jobs and stop using its pages.
-- Legacy reports remain unchanged and are labelled unverified until staff replace them.
SELECT 'No schema or data changes required for V2' AS migration_result;
