-- CreateTable
CREATE TABLE `OpsAiConversation` (
    `id` VARCHAR(191) NOT NULL,
    `asset` VARCHAR(191) NOT NULL,
    `logId` VARCHAR(191) NOT NULL,
    `messages` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `OpsAiConversation_asset_logId_key`(`asset`, `logId`),
    INDEX `OpsAiConversation_asset_idx`(`asset`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
