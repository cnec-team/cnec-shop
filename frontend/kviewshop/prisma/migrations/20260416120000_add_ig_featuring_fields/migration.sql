-- AlterTable: Creator — Featuring + Apify Instagram fields
ALTER TABLE "creators"
  ADD COLUMN "ig_username"              TEXT,
  ADD COLUMN "ig_full_name"             TEXT,
  ADD COLUMN "ig_followers_effective"   INTEGER,
  ADD COLUMN "ig_language"              TEXT,
  ADD COLUMN "ig_avg_reach"             INTEGER,
  ADD COLUMN "ig_avg_likes"             INTEGER,
  ADD COLUMN "ig_avg_video_views"       INTEGER,
  ADD COLUMN "ig_avg_video_likes"       INTEGER,
  ADD COLUMN "ig_avg_comments"          INTEGER,
  ADD COLUMN "ig_audience_gender"       TEXT,
  ADD COLUMN "ig_audience_age"          TEXT,
  ADD COLUMN "ig_estimated_cpr"         INTEGER,
  ADD COLUMN "ig_estimated_ad_cost"     INTEGER,
  ADD COLUMN "ig_profile_pic_url"       TEXT,
  ADD COLUMN "ig_email"                 TEXT,
  ADD COLUMN "ig_last_upload_date"      TEXT,
  ADD COLUMN "ig_data_source"           TEXT;

-- Unique index on ig_username
CREATE UNIQUE INDEX "creators_ig_username_key" ON "creators" ("ig_username");
