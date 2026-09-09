CREATE TABLE "jobs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"type" varchar(50) NOT NULL,
	"status" varchar(20) NOT NULL,
	"priority" smallint DEFAULT 0 NOT NULL,
	"payload" jsonb,
	"result" jsonb,
	"error_message" text,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"max_retries" smallint DEFAULT 3 NOT NULL,
	"run_at" timestamp with time zone,
	"locked_by" varchar(100),
	"started_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
