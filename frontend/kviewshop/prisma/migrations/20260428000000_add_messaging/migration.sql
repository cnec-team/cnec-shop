-- CreateTable
CREATE TABLE IF NOT EXISTS "conversations" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "brand_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "status" VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
    "last_message_at" TIMESTAMPTZ,
    "last_message_text" VARCHAR(200),
    "brand_unread_count" INTEGER NOT NULL DEFAULT 0,
    "creator_unread_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "messages" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "conversation_id" TEXT NOT NULL,
    "sender_role" VARCHAR(10) NOT NULL,
    "sender_user_id" TEXT,
    "type" VARCHAR(15) NOT NULL DEFAULT 'TEXT',
    "content" TEXT NOT NULL,
    "proposal_id" TEXT,
    "read_at" TIMESTAMPTZ,
    "attachments" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "conversations_brand_id_creator_id_key" ON "conversations"("brand_id", "creator_id");
CREATE INDEX IF NOT EXISTS "conversations_brand_id_last_message_at_idx" ON "conversations"("brand_id", "last_message_at");
CREATE INDEX IF NOT EXISTS "conversations_creator_id_last_message_at_idx" ON "conversations"("creator_id", "last_message_at");
CREATE INDEX IF NOT EXISTS "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
