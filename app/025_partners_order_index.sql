-- 025: Add order_index column to partners table
-- Safe to run more than once.

alter table partners add column if not exists order_index integer;
