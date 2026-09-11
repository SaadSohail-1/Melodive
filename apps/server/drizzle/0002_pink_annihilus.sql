ALTER TABLE "albums" ALTER COLUMN "musicbrainz_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "albums" ADD CONSTRAINT "albums_musicbrainz_id_unique" UNIQUE("musicbrainz_id");