ALTER TABLE user_preferences
DROP CONSTRAINT IF EXISTS user_preferences_language_check;

ALTER TABLE user_preferences
ADD CONSTRAINT user_preferences_language_check
CHECK (language IN ('de', 'en', 'es', 'sl'));