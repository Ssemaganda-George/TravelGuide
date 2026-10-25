-- Update coordinates for known Uganda destinations by place_id
-- Run this in Supabase SQL Editor

-- Jinja (Source of the Nile) - ~80 km east of Kampala
update places set lat = 0.4333, lng = 33.2000
where id = '4935db5c-6b1c-4706-b095-948791bef229';

-- Bwindi South: Rushaga and Nkuringo - southwestern Uganda
update places set lat = -1.0554, lng = 29.6281
where id = 'e7e61f32-01a0-4f1a-8d36-1ac26f1f8a11';

-- Mgahinga: Gorillas and Volcanoes - ~11 hrs from Kampala, near Kisoro
update places set lat = -1.3644, lng = 29.6111
where id = 'cc46773b-8087-4e5b-b12e-1c8ca6ff54cd';

-- Lake Bunyonyi - southwestern Uganda, near Kabale
update places set lat = -1.2833, lng = 29.9333
where id = '874a228e-82dd-4234-93ec-2faa9e417d8f';

-- Sipi Falls (draft) - ~5 hrs from Kampala, Mount Elgon
update places set lat = 1.3333, lng = 34.3833
where id = '77dc6695-1790-4f03-86dc-01dbf6dc0dfd';

-- Buganda Kingdom - in/around Kampala
update places set lat = 0.3476, lng = 32.5825
where id = '253fed73-7f91-4a0f-854e-e5fd15f30c33';

-- Murchison Falls - northwestern Uganda
update places set lat = 2.2667, lng = 31.7500
where id = '6246025d-1330-41ce-8b45-608d14d88d9d';

-- Rwenzori Mountains - western Uganda near Kasese
update places set lat = 0.3833, lng = 29.8833
where id = '5eac076a-a43a-48b6-8812-8ecff82ca2a8';

-- Bwindi: Gorillas at Buhoma - southwestern Uganda
update places set lat = -1.0554, lng = 29.6281
where id = 'ae3b6302-3c29-4bd5-9871-1523b00ee3f5';

-- Kibale Forest: Chimpanzee Tracking - western Uganda near Fort Portal
update places set lat = 0.4833, lng = 30.3833
where id = '9b151caa-c69d-4c1b-874f-16e935c3b790';

-- Queen Elizabeth National Park - western Uganda
update places set lat = -0.1367, lng = 30.0407
where id = '8f6c9558-5c4f-4c15-abf7-129632c78c95';

-- Kidepo Valley - far northeastern Uganda
update places set lat = 3.8833, lng = 33.7500
where id = 'f60c6df0-ef10-46d6-a237-6e565fe4b31e';

-- Also add Entebbe, Kampala capital reference
update places set lat = 0.0500, lng = 32.4667
where slug = 'entebbe' and type = 'destination';

update places set lat = 0.3476, lng = 32.5825
where slug = 'kampala' and type = 'destination';

-- Verify all updates
select p.id, p.name, p.slug, p.lat, p.lng, dc.title, dc.travel_time
from places p
left join destination_content dc on dc.place_id = p.id and dc.language = 'en'
where p.type = 'destination'
order by p.name;