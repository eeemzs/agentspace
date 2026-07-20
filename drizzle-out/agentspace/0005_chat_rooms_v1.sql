CREATE TABLE "chat-rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"scopeId" uuid NOT NULL,
	"projectId" uuid,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"kind" text NOT NULL,
	"purpose" text,
	"guidanceMarkdown" text,
	"status" text NOT NULL,
	"dmKey" text,
	"lastSeq" integer DEFAULT 0 NOT NULL,
	"lastMessageAt" timestamp with time zone,
	"createdBy" text,
	"updatedBy" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat-room-members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"scopeId" uuid NOT NULL,
	"roomId" uuid NOT NULL,
	"agentId" text NOT NULL,
	"roleKey" text NOT NULL,
	"brief" text,
	"status" text NOT NULL,
	"lastReadSeq" integer DEFAULT 0 NOT NULL,
	"joinedAt" timestamp with time zone NOT NULL,
	"leftAt" timestamp with time zone,
	"createdBy" text,
	"updatedBy" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat-room-bindings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"scopeId" uuid NOT NULL,
	"roomId" uuid NOT NULL,
	"bindingType" text NOT NULL,
	"refId" text,
	"uri" text,
	"title" text,
	"note" text,
	"createdBy" text,
	"updatedBy" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat-messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"scopeId" uuid NOT NULL,
	"roomId" uuid NOT NULL,
	"seq" integer NOT NULL,
	"authorAgentId" text NOT NULL,
	"kind" text NOT NULL,
	"text" text NOT NULL,
	"mentions" jsonb,
	"replyToSeq" integer,
	"idempotencyKey" text,
	"createdBy" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "chat-rooms" ADD CONSTRAINT "chat-rooms_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat-room-members" ADD CONSTRAINT "chat-room-members_roomId_chat-rooms_id_fk" FOREIGN KEY ("roomId") REFERENCES "public"."chat-rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat-room-bindings" ADD CONSTRAINT "chat-room-bindings_roomId_chat-rooms_id_fk" FOREIGN KEY ("roomId") REFERENCES "public"."chat-rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat-messages" ADD CONSTRAINT "chat-messages_roomId_chat-rooms_id_fk" FOREIGN KEY ("roomId") REFERENCES "public"."chat-rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "chat_room_tenant_scope_slug_unique" ON "chat-rooms" USING btree ("tenantId","scopeId","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "chat_room_tenant_scope_dm_key_unique" ON "chat-rooms" USING btree ("tenantId","scopeId","dmKey");--> statement-breakpoint
CREATE INDEX "chat_room_idx_tenant" ON "chat-rooms" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "chat_room_idx_scope_updated" ON "chat-rooms" USING btree ("tenantId","scopeId","updatedAt");--> statement-breakpoint
CREATE INDEX "chat_room_idx_project_updated" ON "chat-rooms" USING btree ("tenantId","projectId","updatedAt");--> statement-breakpoint
CREATE INDEX "chat_room_idx_scope_last_message" ON "chat-rooms" USING btree ("tenantId","scopeId","lastMessageAt");--> statement-breakpoint
CREATE UNIQUE INDEX "chat_room_member_tenant_room_agent_unique" ON "chat-room-members" USING btree ("tenantId","roomId","agentId");--> statement-breakpoint
CREATE INDEX "chat_room_member_idx_tenant" ON "chat-room-members" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "chat_room_member_idx_room_status" ON "chat-room-members" USING btree ("tenantId","roomId","status");--> statement-breakpoint
CREATE INDEX "chat_room_member_idx_scope_agent" ON "chat-room-members" USING btree ("tenantId","scopeId","agentId","status");--> statement-breakpoint
CREATE INDEX "chat_room_binding_idx_tenant" ON "chat-room-bindings" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "chat_room_binding_idx_room_type" ON "chat-room-bindings" USING btree ("tenantId","roomId","bindingType");--> statement-breakpoint
CREATE INDEX "chat_room_binding_idx_scope_type" ON "chat-room-bindings" USING btree ("tenantId","scopeId","bindingType");--> statement-breakpoint
CREATE UNIQUE INDEX "chat_message_tenant_room_seq_unique" ON "chat-messages" USING btree ("tenantId","roomId","seq");--> statement-breakpoint
CREATE UNIQUE INDEX "chat_message_tenant_room_idempotency_unique" ON "chat-messages" USING btree ("tenantId","roomId","idempotencyKey");--> statement-breakpoint
CREATE INDEX "chat_message_idx_tenant" ON "chat-messages" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "chat_message_idx_room_seq" ON "chat-messages" USING btree ("tenantId","roomId","seq");--> statement-breakpoint
CREATE INDEX "chat_message_idx_room_created" ON "chat-messages" USING btree ("tenantId","roomId","createdAt");--> statement-breakpoint
CREATE INDEX "chat_message_idx_scope_created" ON "chat-messages" USING btree ("tenantId","scopeId","createdAt");--> statement-breakpoint
CREATE INDEX "chat_message_idx_author_created" ON "chat-messages" USING btree ("tenantId","authorAgentId","createdAt");
