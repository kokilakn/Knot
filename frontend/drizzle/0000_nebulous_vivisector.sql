CREATE TABLE "event_participants" (
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_participants_event_id_user_id_pk" PRIMARY KEY("event_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"event_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"event_date" timestamp with time zone NOT NULL,
	"user_id" uuid NOT NULL,
	"notes" text,
	"cover_page_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link" text NOT NULL,
	"vector" text,
	"event_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"oauth_id" text,
	"password" text,
	"avatar_url" text,
	"selfie_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_oauth_id_unique" UNIQUE("oauth_id")
);
--> statement-breakpoint
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_event_id_events_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("event_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_event_id_events_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("event_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_event_participants_user_id" ON "event_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_event_participants_event_id" ON "event_participants" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_events_user_id" ON "events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_events_event_date" ON "events" USING btree ("event_date");--> statement-breakpoint
CREATE INDEX "idx_events_code" ON "events" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_photos_event_id" ON "photos" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_oauth_id" ON "users" USING btree ("oauth_id");