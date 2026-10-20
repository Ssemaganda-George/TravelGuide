-- Add email and country to destination_reviews (required for review submissions)
alter table destination_reviews
  add column if not exists email text,
  add column if not exists country text;

-- API route for submitting reviews (public inserts)
-- POST /api/review with { placeId, rating, author, email, country, comment }
