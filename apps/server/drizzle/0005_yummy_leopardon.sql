ALTER TABLE "favorites" ADD CONSTRAINT "favorites_track_id_unique" UNIQUE("track_id");--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_album_id_unique" UNIQUE("album_id");--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_artist_id_unique" UNIQUE("artist_id");