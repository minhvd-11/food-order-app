-- CreateTable
CREATE TABLE "ChatSubscriber" (
    "id" TEXT NOT NULL,
    "chatUserId" TEXT NOT NULL,
    "spaceName" TEXT NOT NULL,
    "displayName" TEXT,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatSubscriber_chatUserId_key" ON "ChatSubscriber"("chatUserId");
