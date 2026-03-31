CREATE TABLE "scopes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"type" text NOT NULL,
	"parentScopeId" uuid,
	"createdBy" text,
	"updatedBy" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "scopeId" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "scopeId" uuid NOT NULL;--> statement-breakpoint
CREATE INDEX "scope_idx_tenant" ON "scopes" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "scope_idx_parent" ON "scopes" USING btree ("tenantId","parentScopeId");--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_scopeId_scopes_id_fk" FOREIGN KEY ("scopeId") REFERENCES "public"."scopes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_scopeId_scopes_id_fk" FOREIGN KEY ("scopeId") REFERENCES "public"."scopes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "project_scope_unique" ON "projects" USING btree ("scopeId");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_scope_unique" ON "workspaces" USING btree ("scopeId");