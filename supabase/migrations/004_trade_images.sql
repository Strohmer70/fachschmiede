-- Add hero_image and team_image columns to trades table
-- for trade-specific images (prevents Dachdecker images on Gartenbau pages)

alter table trades 
  add column if not exists hero_image text default null,
  add column if not exists team_image text default null;

-- Update existing trades with default images
update trades set hero_image = '/images/dachdecker-hero.jpg', team_image = '/images/dach-decker-team.jpg' where slug = 'dachdecker';
update trades set hero_image = '/images/elektriker-hero.jpg', team_image = '/images/elektriker-team.jpg' where slug = 'elektriker';
update trades set hero_image = '/images/klempner-hero.jpg', team_image = '/images/klempner-team.jpg' where slug = 'klempner';
update trades set hero_image = '/images/maler-hero.jpg', team_image = '/images/maler-team.jpg' where slug = 'maler';
update trades set hero_image = '/images/zimmerer-hero.jpg', team_image = '/images/zimmerer-team.jpg' where slug = 'zimmerer';
update trades set hero_image = '/images/garten-hero.jpg', team_image = '/images/garten-team.jpg' where slug = 'garten-und-landschaftsbau';
