-- CreateTable
CREATE TABLE `SessionPackage` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `appSource` VARCHAR(191) NOT NULL,
    `totalSessions` INTEGER NOT NULL,
    `manualFulfilled` INTEGER NOT NULL,
    `funyulaUsedBaseline` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SessionPackage_email_appSource_key`(`email`, `appSource`),
    INDEX `SessionPackage_appSource_idx`(`appSource`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
