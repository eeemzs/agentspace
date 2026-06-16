ALTER TABLE "agent-sessions" ADD COLUMN "missionId" uuid;--> statement-breakpoint
CREATE TABLE "missions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"scopeId" uuid NOT NULL,
	"slug" text,
	"status" text NOT NULL,
	"objective" text NOT NULL,
	"taskDefinition" text,
	"successCriteria" jsonb,
	"constraints" jsonb,
	"policy" jsonb,
	"roles" jsonb,
	"references" jsonb,
	"visionDocRef" jsonb,
	"activeImplementationPlanRef" jsonb,
	"lineage" jsonb,
	"sourceTemplateRef" jsonb,
	"bodyMarkdown" text,
	"meta" jsonb,
	"createdBy" text,
	"updatedBy" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "agent_session_idx_mission" ON "agent-sessions" USING btree ("tenantId","missionId");--> statement-breakpoint
CREATE UNIQUE INDEX "mission_scope_slug_unique" ON "missions" USING btree ("tenantId","scopeId","slug");--> statement-breakpoint
CREATE INDEX "mission_idx_tenant" ON "missions" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "mission_idx_scope" ON "missions" USING btree ("tenantId","scopeId");--> statement-breakpoint
CREATE INDEX "mission_idx_status" ON "missions" USING btree ("tenantId","scopeId","status");
