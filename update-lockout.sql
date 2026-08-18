-- Set brute force lockout duration to 5 hours (18000 seconds)
-- Run this in Supabase Dashboard > SQL Editor

-- Option 1: Check current config
select * from auth.configurations;

-- Option 2: Update the lockout duration
-- Run this AFTER checking the table structure above
update auth.configurations
set value = '18000'
where parameter = 'lockout_duration';

-- Verify the change
select * from auth.configurations where parameter = 'lockout_duration';
