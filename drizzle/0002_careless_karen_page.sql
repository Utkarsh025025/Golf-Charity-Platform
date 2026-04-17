ALTER TABLE `golfScores` ADD CONSTRAINT `userDateUnique` UNIQUE(`userId`,`scoreDate`);--> statement-breakpoint
ALTER TABLE `userCharities` ADD CONSTRAINT `userCharities_userId_unique` UNIQUE(`userId`);--> statement-breakpoint
ALTER TABLE `userCharities` ADD CONSTRAINT `userCharityUnique` UNIQUE(`userId`);