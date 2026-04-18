/**
 * Game Constants — Code Breaker
 *
 * Konfigurasi game: max attempts, XP multipliers, badge definitions.
 * Digunakan oleh gameService dan progressionService.
 *
 * @module constants/gameConstants
 */

/** Hex digit set (0-9, A-F) */
const HEX_CHARS = '0123456789ABCDEF';

/** Panjang kode rahasia */
const CODE_LENGTH = 4;

/**
 * Konfigurasi per game mode.
 * @type {Object.<string, {maxAttempts: number, xpMultiplier: number}>}
 */
const GAME_MODES = {
  classic: { maxAttempts: 8, xpMultiplier: 1.0 },
  daily:   { maxAttempts: 8, xpMultiplier: 1.5 },
  cipher:  { maxAttempts: 6, xpMultiplier: 2.0 },
};

/**
 * Feedback status per digit.
 */
const FEEDBACK_STATUS = {
  CORRECT:   'correct',
  MISPLACED: 'misplaced',
  WRONG:     'wrong',
};

/**
 * Score calculation: (MaxAttempts - AttemptsUsed + 1) * 100
 *
 * @param {number} maxAttempts - Max attempts untuk mode tersebut.
 * @param {number} attemptsUsed - Jumlah tebakan yang sudah dipakai.
 * @returns {number} Skor akhir.
 */
function calculateScore(maxAttempts, attemptsUsed) {
  return (maxAttempts - attemptsUsed + 1) * 100;
}

/**
 * Caesar Hex Cipher: shift setiap hex digit.
 *
 * @param {string} plaintext - 4 karakter hex.
 * @param {number} shift - Nilai shift (0-15).
 * @returns {string} Ciphertext (4 karakter hex uppercase).
 */
function caesarHexEncrypt(plaintext, shift) {
  return plaintext
    .toUpperCase()
    .split('')
    .map((ch) => {
      const idx = HEX_CHARS.indexOf(ch);
      if (idx === -1) return ch;
      return HEX_CHARS[(idx + shift) % 16];
    })
    .join('');
}

/**
 * Generate feedback array per digit.
 * 🟢 correct = posisi & digit benar
 * 🟡 misplaced = digit ada tapi posisi salah
 * ⚫ wrong = digit tidak ada
 *
 * @param {string} guess - Tebakan user (4 hex chars, uppercase).
 * @param {string} secret - Kode rahasia (4 hex chars, uppercase).
 * @returns {Array<{position: number, digit: string, status: string}>}
 */
function generateFeedback(guess, secret) {
  const feedback = [];
  const secretArr = secret.split('');
  const guessArr = guess.split('');
  const used = new Array(CODE_LENGTH).fill(false);
  const matched = new Array(CODE_LENGTH).fill(false);

  // Pass 1: Exact matches (correct)
  for (let i = 0; i < CODE_LENGTH; i++) {
    if (guessArr[i] === secretArr[i]) {
      feedback[i] = { position: i, digit: guessArr[i], status: FEEDBACK_STATUS.CORRECT };
      used[i] = true;
      matched[i] = true;
    }
  }

  // Pass 2: Misplaced / Wrong
  for (let i = 0; i < CODE_LENGTH; i++) {
    if (matched[i]) continue;

    let found = false;
    for (let j = 0; j < CODE_LENGTH; j++) {
      if (!used[j] && guessArr[i] === secretArr[j]) {
        feedback[i] = { position: i, digit: guessArr[i], status: FEEDBACK_STATUS.MISPLACED };
        used[j] = true;
        found = true;
        break;
      }
    }

    if (!found) {
      feedback[i] = { position: i, digit: guessArr[i], status: FEEDBACK_STATUS.WRONG };
    }
  }

  return feedback;
}

/**
 * Generate random hex code (4 digits).
 *
 * @returns {string} e.g. "A3F1"
 */
function generateRandomCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += HEX_CHARS[Math.floor(Math.random() * 16)];
  }
  return code;
}

/**
 * Generate deterministic daily code dari tanggal + secret.
 * Menggunakan simple hash seeding.
 *
 * @param {string} dateStr - Format YYYY-MM-DD.
 * @param {string} secret - Daily challenge secret dari env.
 * @returns {{ code: string, seed: string }}
 */
function generateDailyCode(dateStr, secret) {
  const crypto = require('crypto');
  const seed = crypto.createHmac('sha256', secret).update(dateStr).digest('hex');

  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    const hexIdx = parseInt(seed.charAt(i * 2), 16);
    code += HEX_CHARS[hexIdx];
  }

  return { code, seed };
}

/**
 * Badge/Achievement definitions.
 * 10 badges sesuai SRS FR-PG-04.
 *
 * @type {Array<{id: string, name: string, description: string, condition: string}>}
 */
const BADGES = [
  { id: 'B-01', name: 'First Blood',    description: 'Complete your first game',        condition: 'totalGamesPlayed >= 1' },
  { id: 'B-02', name: 'Code Master',    description: 'Solve in 1-3 attempts',           condition: 'solvedIn3OrLess' },
  { id: 'B-03', name: 'Perfectionist',  description: 'Score 800 in Classic mode',       condition: 'classicBestScore >= 800' },
  { id: 'B-04', name: 'Streak Lord',    description: 'Achieve a 7-day streak',          condition: 'longestStreak >= 7' },
  { id: 'B-05', name: 'Daily Devotee',  description: 'Complete 10 Daily Challenges',    condition: 'dailyGamesPlayed >= 10' },
  { id: 'B-06', name: 'Cipher Breaker', description: 'Win 5 Cipher Crack games',        condition: 'cipherGamesWon >= 5' },
  { id: 'B-07', name: 'Veteran',        description: 'Play 50 total games',             condition: 'totalGamesPlayed >= 50' },
  { id: 'B-08', name: 'Champion',       description: 'Reach Level 10',                  condition: 'level >= 10' },
  { id: 'B-09', name: 'Legend',         description: 'Reach Level 25',                  condition: 'level >= 25' },
  { id: 'B-10', name: 'Hex God',        description: 'Win 100 total games',             condition: 'totalGamesWon >= 100' },
];

/**
 * Hitung level berdasarkan total XP.
 * Level = floor(totalXP / 1000) + 1, max 50.
 *
 * @param {number} totalXp - Total XP pemain.
 * @returns {number} Level (1-50).
 */
function calculateLevel(totalXp) {
  return Math.min(Math.floor(totalXp / 1000) + 1, 50);
}

module.exports = {
  HEX_CHARS,
  CODE_LENGTH,
  GAME_MODES,
  FEEDBACK_STATUS,
  BADGES,
  calculateScore,
  caesarHexEncrypt,
  generateFeedback,
  generateRandomCode,
  generateDailyCode,
  calculateLevel,
};
