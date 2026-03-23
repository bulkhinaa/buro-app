-- =============================================
-- Add rejection_reason column to stages table
-- Used by MasterTaskDetailScreen when stage is rejected by supervisor
-- =============================================

ALTER TABLE stages ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
