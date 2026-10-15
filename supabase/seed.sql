-- Starter places and one DRAFT page. Rewrite the text in your own voice, then set status = 'published'.
insert into places (name, slug, type, parent_id)
select v.name, v.slug, 'destination', c.id
from places c, (values ('Jinja','jinja'), ('Sipi Falls','sipi-falls'), ('Lake Bunyonyi','lake-bunyonyi')) as v(name, slug)
where c.slug = 'uganda' and c.type = 'country'
on conflict (slug) do nothing;

insert into destination_content (place_id, title, hook, story, best_months, budget_range, ideal_days, tags, getting_there, local_tip, tip_author, last_checked, status)
select id, 'Jinja', 'Where the Nile begins, and where Uganda goes to play.',
 E'Jinja doesn''t announce itself. The road slides past tea estates and sugarcane, then the air turns cooler and smells of water.\n\nThis is where Lake Victoria narrows and begins its journey north as the Nile. By day it is Uganda''s adventure capital; by evening it slows right down.',
 'Dec-Feb, Jun-Aug', 'Budget to comfortable', 3, array['adventure','relaxing'],
 'About 80 km east of Kampala by road. Leave outside rush hour: the first stretch out of the city can double your travel time.',
 'Book rafting for the morning, when the light is best for photos.', 'George', current_date, 'draft'
from places where slug = 'jinja'
on conflict (place_id, language) do nothing;
