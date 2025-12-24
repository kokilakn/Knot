ALTER TABLE "photos" ADD COLUMN "uploader_id" uuid;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_uploader_id_users_id_fk" FOREIGN KEY ("uploader_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_photos_uploader_id" ON "photos" USING btree ("uploader_id");