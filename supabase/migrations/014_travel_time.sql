-- Add travel_time column to destination_content
alter table destination_content
add column if not exists travel_time text;
