CREATE TABLE "workflow-definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"workspaceId" uuid NOT NULL,
	"projectId" uuid,
	"definitionId" text NOT NULL,
	"name" text NOT NULL,
	"mode" text NOT NULL,
	"subjectType" text,
	"runtimeProfile" text,
	"steps" jsonb NOT NULL,
	"policies" jsonb,
	"meta" jsonb,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "codex-chat-settings" ADD COLUMN "modelProvider" text;--> statement-breakpoint
ALTER TABLE "codex-chat-settings" ADD COLUMN "serviceTier" text;--> statement-breakpoint
ALTER TABLE "codex-chat-settings" ADD COLUMN "personality" text;--> statement-breakpoint
ALTER TABLE "codex-chat-settings" ADD COLUMN "approvalsReviewer" text;--> statement-breakpoint
ALTER TABLE "codex-chat-settings" ADD COLUMN "persistExtendedHistory" boolean;--> statement-breakpoint
ALTER TABLE "codex-chat-settings" ADD COLUMN "experimentalApi" boolean;--> statement-breakpoint
ALTER TABLE "codex-chat-settings" ADD COLUMN "optOutNotificationMethods" text;--> statement-breakpoint
ALTER TABLE "workflow-definitions" ADD CONSTRAINT "workflow-definitions_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow-definitions" ADD CONSTRAINT "workflow-definitions_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_definition_unique_definition_id" ON "workflow-definitions" USING btree ("tenantId","workspaceId","definitionId");--> statement-breakpoint
CREATE INDEX "workflow_definition_idx_workspace_mode" ON "workflow-definitions" USING btree ("tenantId","workspaceId","mode");--> statement-breakpoint
CREATE INDEX "workflow_definition_idx_workspace_subject" ON "workflow-definitions" USING btree ("tenantId","workspaceId","subjectType");