
-- Clear all test/dummy data from the database
-- This will remove all data from inventory, sales, customers, and tasks tables
-- Run this script carefully as it will permanently delete all existing data

-- Clear sales data first (due to foreign key constraints)
DELETE FROM public.sales;

-- Clear customers data
DELETE FROM public.customers;

-- Clear inventory data
DELETE FROM public.inventory;

-- Clear tasks data (if table exists)
DELETE FROM public.tasks;

-- Reset any sequences/auto-increment counters (optional)
-- This ensures new data starts with clean IDs

-- Verify all tables are empty
SELECT 'inventory' as table_name, COUNT(*) as record_count FROM public.inventory
UNION ALL
SELECT 'sales' as table_name, COUNT(*) as record_count FROM public.sales
UNION ALL
SELECT 'customers' as table_name, COUNT(*) as record_count FROM public.customers
UNION ALL
SELECT 'tasks' as table_name, COUNT(*) as record_count FROM public.tasks;
