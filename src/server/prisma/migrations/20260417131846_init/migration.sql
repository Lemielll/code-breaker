-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'player',
    "total_xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_played_date" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "game_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "guest_nickname" TEXT,
    "mode" TEXT NOT NULL,
    "secret_code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "score" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL,
    "attempts_used" INTEGER NOT NULL DEFAULT 0,
    "hints_used" INTEGER NOT NULL DEFAULT 0,
    "cipher_puzzle_id" TEXT,
    "daily_challenge_id" TEXT,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    CONSTRAINT "game_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "game_sessions_cipher_puzzle_id_fkey" FOREIGN KEY ("cipher_puzzle_id") REFERENCES "cipher_puzzles" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "game_sessions_daily_challenge_id_fkey" FOREIGN KEY ("daily_challenge_id") REFERENCES "daily_challenges" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "guesses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_id" TEXT NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "guess_value" TEXT NOT NULL,
    "feedback_json" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "guesses_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "game_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "daily_challenges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "challenge_date" TEXT NOT NULL,
    "secret_code" TEXT NOT NULL,
    "seed" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "cipher_puzzles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "plaintext" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "cipher_method" TEXT NOT NULL DEFAULT 'caesar_hex',
    "shift_value" INTEGER NOT NULL,
    "hint" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cipher_puzzles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "badge_id" TEXT NOT NULL,
    "unlocked_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_stats" (
    "user_id" TEXT NOT NULL PRIMARY KEY,
    "classic_games_played" INTEGER NOT NULL DEFAULT 0,
    "classic_games_won" INTEGER NOT NULL DEFAULT 0,
    "classic_best_score" INTEGER NOT NULL DEFAULT 0,
    "daily_games_played" INTEGER NOT NULL DEFAULT 0,
    "daily_games_won" INTEGER NOT NULL DEFAULT 0,
    "daily_best_score" INTEGER NOT NULL DEFAULT 0,
    "cipher_games_played" INTEGER NOT NULL DEFAULT 0,
    "cipher_games_won" INTEGER NOT NULL DEFAULT 0,
    "cipher_best_score" INTEGER NOT NULL DEFAULT 0,
    "total_games_played" INTEGER NOT NULL DEFAULT 0,
    "total_games_won" INTEGER NOT NULL DEFAULT 0,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "game_sessions_user_id_idx" ON "game_sessions"("user_id");

-- CreateIndex
CREATE INDEX "game_sessions_mode_score_idx" ON "game_sessions"("mode", "score");

-- CreateIndex
CREATE INDEX "game_sessions_user_id_daily_challenge_id_idx" ON "game_sessions"("user_id", "daily_challenge_id");

-- CreateIndex
CREATE INDEX "guesses_session_id_idx" ON "guesses"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "guesses_session_id_attempt_number_key" ON "guesses"("session_id", "attempt_number");

-- CreateIndex
CREATE UNIQUE INDEX "daily_challenges_challenge_date_key" ON "daily_challenges"("challenge_date");

-- CreateIndex
CREATE INDEX "cipher_puzzles_status_idx" ON "cipher_puzzles"("status");

-- CreateIndex
CREATE INDEX "user_achievements_user_id_idx" ON "user_achievements"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_user_id_badge_id_key" ON "user_achievements"("user_id", "badge_id");
