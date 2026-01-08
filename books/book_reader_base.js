/**
 * Book Reader Base Library
 * Shared JavaScript for all book reader pages
 * Uses Google Translate TTS for consistent audio (identical to english_quiz.html)
 */

class BookReader {
  constructor(bookData) {
    this.bookData = bookData;
    this.currentTab = 'read';
    this.currentSentence = 0;
    this.currentWord = 0;
    this.isPlaying = false;
    this.speed = 0.9; // 기본 속도 0.9 (초등학생용)
    this.showKorean = true;
    this.isFlipped = false;

    // Web Audio API & Cache State
    this.audioContext = null;
    this.audioUnlocked = false;
    this.audioCache = new Map(); // word/sentence -> Audio object

    // Load saved progress
    this.loadProgress();

    // Initialize
    this.init();
  }

  init() {
    this.createStars();
    this.setupTabs();
    this.setupReadMode();
    this.setupWordMode();
    this.setupReviewMode();
    this.setupSpeedControl();
    this.updateProgress();

    // Unlock audio on first user interaction
    ['click', 'touchstart', 'keydown'].forEach(event => {
      document.body.addEventListener(event, () => this.unlockAudio(), { once: true });
    });
  }

  // ==================== Audio Engine (iOS Compatible) ====================

  // Audio Context Singleton
  getAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }

  // Unlock Audio (Required for iOS)
  async unlockAudio() {
    if (this.audioUnlocked) return;

    const ctx = this.getAudioContext();

    // Resume if suspended
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (e) {
        console.log('AudioContext resume failed:', e);
      }
    }

    // 1. Play silent buffer
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    try {
      source.start(0);
    } catch (e) { }

    // 2. Keep-Alive Oscillator
    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'square';
      oscillator.frequency.value = 0.01; // Low frequency
      gainNode.gain.value = 0.0001; // Silent

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start();
      this.audioUnlocked = true;
      console.log('Audio engine unlocked & Keep-Alive active');
    } catch (err) {
      console.log('Keep-alive setup failed:', err);
      this.audioUnlocked = true; // Assume unlocked anyway
    }
  }

  // Preload Audio
  preloadAudio(text) {
    if (!text) return;
    if (this.audioCache.has(text)) return;

    // Google Translate TTS URL
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(text)}`;

    const audio = new Audio(url);
    audio.preload = 'auto';
    audio.load();

    this.audioCache.set(text, audio);
  }

  // Play Audio
  async playAudio(text) {
    await this.unlockAudio();

    // Cancel/Pause any currently playing audio if we had a global reference (optional)
    // For now, simpler implementation:

    if (!this.audioCache.has(text)) {
      this.preloadAudio(text);
    }

    const audio = this.audioCache.get(text);

    return new Promise((resolve, reject) => {
      if (!audio) {
        resolve();
        return;
      }

      try {
        audio.currentTime = 0;
        audio.playbackRate = this.speed;

        audio.onended = () => resolve();
        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          resolve();
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log('Playback failed:', error);
            resolve();
          });
        }
      } catch (e) {
        console.error('Play execution error:', e);
        resolve();
      }
    });
  }

  // ==================== Stars Animation ====================
  createStars() {
    const starsContainer = document.getElementById('stars');
    if (!starsContainer) return;

    const numberOfStars = 50;
    for (let i = 0; i < numberOfStars; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.animationDelay = Math.random() * 3 + 's';
      starsContainer.appendChild(star);
    }
  }

  // ==================== Tab Navigation ====================
  setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });
  }

  switchTab(tab) {
    this.currentTab = tab;

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tab}-tab`);
    });

    // Refresh content based on tab
    if (tab === 'words') {
      this.showNextWord();
    } else if (tab === 'review') {
      this.updateReviewStats();
    }
  }

  // ==================== Reading Mode ====================
  setupReadMode() {
    const sentences = this.bookData.story;
    const container = document.getElementById('sentences-container');

    sentences.forEach((sentence, index) => {
      // Preload audio for sentences
      this.preloadAudio(sentence.en);

      const card = document.createElement('div');
      card.className = 'sentence-card';
      card.dataset.index = index;

      // Highlight words in English sentence
      let enText = sentence.en;
      if (sentence.highlightWords) {
        sentence.highlightWords.forEach(word => {
          const regex = new RegExp(`\\b${word}\\b`, 'gi');
          enText = enText.replace(regex, `<span class="highlight-word">${word}</span>`);
        });
      }

      card.innerHTML = `
        <div class="sentence-en">
          <span class="play-icon">🎧</span>
          <span>${enText}</span>
        </div>
        <div class="sentence-ko ${this.showKorean ? '' : 'hidden'}">${sentence.ko}</div>
      `;

      card.addEventListener('click', () => this.playSentence(index));
      container.appendChild(card);
    });

    // Toggle Korean button
    const toggleBtn = document.getElementById('toggle-korean');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleKorean());
    }
  }

  async playSentence(index) {
    if (this.isPlaying) return;

    this.currentSentence = index;
    const sentence = this.bookData.story[index];
    const card = document.querySelectorAll('.sentence-card')[index];

    // Highlight current card
    document.querySelectorAll('.sentence-card').forEach(c => c.classList.remove('playing'));
    card.classList.add('playing');

    // Play Audio
    this.isPlaying = true;
    await this.playAudio(sentence.en);
    this.isPlaying = false;

    // Update progress
    this.updateReadProgress(index);
    this.saveProgress();
  }

  toggleKorean() {
    this.showKorean = !this.showKorean;
    document.querySelectorAll('.sentence-ko').forEach(ko => {
      ko.classList.toggle('hidden', !this.showKorean);
    });

    const btn = document.getElementById('toggle-korean');
    if (btn) {
      btn.textContent = this.showKorean ? '한글 숨기기' : '한글 보기';
    }
  }

  updateReadProgress(maxIndex) {
    // Update highest read sentence
    if (maxIndex >= (this.progress.lastReadSentence || 0)) {
      this.progress.lastReadSentence = maxIndex;
    }

    const total = this.bookData.story.length;
    const completed = this.progress.lastReadSentence + 1;
    const percentage = (completed / total) * 100;

    const progressBar = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');

    if (progressBar) progressBar.style.width = percentage + '%';
    if (progressText) progressText.textContent = `${completed} / ${total} 문장`;
  }

  setupSpeedControl() {
    const speedBtns = document.querySelectorAll('.speed-btn');
    speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const speed = parseFloat(btn.dataset.speed);
        this.speed = speed;

        speedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  // ==================== Word Learning Mode ====================
  setupWordMode() {
    this.showNextWord();

    const flashcard = document.getElementById('flashcard');
    if (flashcard) {
      flashcard.addEventListener('click', () => this.flipCard());
    }

    const knowBtn = document.getElementById('know-btn');
    const studyBtn = document.getElementById('study-btn');

    if (knowBtn) knowBtn.addEventListener('click', (e) => { e.stopPropagation(); this.answerWord(true); });
    if (studyBtn) studyBtn.addEventListener('click', (e) => { e.stopPropagation(); this.answerWord(false); });
  }

  showNextWord() {
    // Get words that need review
    const wordsToReview = this.getWordsToReview();

    if (wordsToReview.length === 0) {
      this.showWordComplete();
      return;
    }

    this.currentWord = 0;
    this.currentWordData = wordsToReview[0];
    // Preload audio for the word
    this.preloadAudio(this.currentWordData.word);

    this.renderFlashcard();
  }

  getWordsToReview() {
    const now = Date.now();
    return this.bookData.vocabulary.filter(word => {
      const wordProgress = this.progress.vocabulary[word.word] || {
        learned: false,
        nextReview: now,
        correctCount: 0
      };

      // Review if it's time or if it's a new word
      return !wordProgress.learned || wordProgress.nextReview <= now;
    });
  }

  renderFlashcard() {
    const word = this.currentWordData;
    const wordsToReview = this.getWordsToReview();

    document.getElementById('word-text').textContent = word.word;
    document.getElementById('word-meaning').textContent = word.meaning;
    document.getElementById('word-example').textContent = word.example;

    const counter = document.getElementById('card-counter');
    if (counter) {
      counter.textContent = `${this.currentWord + 1} / ${wordsToReview.length} 단어`;
    }

    this.isFlipped = false;
    document.getElementById('word-front').style.display = 'block';
    document.getElementById('word-back').classList.remove('show');
    document.getElementById('flashcard').classList.remove('flipped');
  }

  flipCard() {
    if (this.isFlipped) return;

    this.isFlipped = true;
    document.getElementById('word-front').style.display = 'none';
    document.getElementById('word-back').classList.add('show');
    document.getElementById('flashcard').classList.add('flipped');

    // Play pronunciation
    this.playAudio(this.currentWordData.word);
  }

  answerWord(knew) {
    const word = this.currentWordData.word;
    const now = Date.now();

    if (!this.progress.vocabulary[word]) {
      this.progress.vocabulary[word] = {
        learned: false,
        correctCount: 0,
        lastReview: now,
        nextReview: now
      };
    }

    const wordProgress = this.progress.vocabulary[word];

    if (knew) {
      wordProgress.correctCount++;

      // Spaced repetition algorithm
      if (wordProgress.correctCount >= 3) {
        wordProgress.learned = true;
        wordProgress.nextReview = now + (7 * 24 * 60 * 60 * 1000); // 1 week
      } else {
        wordProgress.nextReview = now + (2 * 24 * 60 * 60 * 1000); // 2 days
      }
    } else {
      wordProgress.correctCount = 0;
      wordProgress.nextReview = now + (60 * 60 * 1000); // 1 hour
    }

    wordProgress.lastReview = now;
    this.saveProgress();

    // Move to next word
    // Recalculate remaining list
    const wordsToReview = this.getWordsToReview();
    // Since we answered one, if it was 'knew' and pushed to future, it's gone from list.
    // If it was 'study', it might stay or be pushed slightly.
    // For simplicity, just reload the next one from the fresh list.

    if (wordsToReview.length > 0) {
      this.currentWordData = wordsToReview[0];
      this.preloadAudio(this.currentWordData.word);
      this.renderFlashcard();
    } else {
      this.showWordComplete();
    }
  }

  showWordComplete() {
    const flashcardContainer = document.querySelector('.flashcard-container');
    flashcardContainer.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <div style="font-size: 3rem; margin-bottom: 20px;">🎉</div>
        <h2 style="color: #6B46C1; margin-bottom: 15px;">완료했어요!</h2>
        <p style="color: #666; margin-bottom: 30px;">모든 단어를 복습했습니다.</p>
        <button class="control-btn" onclick="location.reload()">다시 시작</button>
      </div>
    `;
  }

  // ==================== Review Mode ====================
  setupReviewMode() {
    this.updateReviewStats();
  }

  updateReviewStats() {
    const totalWords = this.bookData.vocabulary.length;
    const masteredWords = this.bookData.vocabulary.filter(word => {
      const wp = this.progress.vocabulary[word.word];
      return wp && wp.learned;
    });
    const wordsToReview = this.getWordsToReview();

    // Update stats
    const totalSentencesEl = document.getElementById('total-sentences');
    if (totalSentencesEl) totalSentencesEl.textContent = this.bookData.story.length;

    const completedSentencesEl = document.getElementById('completed-sentences');
    if (completedSentencesEl) completedSentencesEl.textContent = (this.progress.lastReadSentence || 0) + 1;

    const masteredWordsEl = document.getElementById('mastered-words');
    if (masteredWordsEl) masteredWordsEl.textContent = masteredWords.length;

    const totalWordsEl = document.getElementById('total-words');
    if (totalWordsEl) totalWordsEl.textContent = totalWords;

    // Star rating
    const percentage = totalWords > 0 ? (masteredWords.length / totalWords) * 100 : 0;
    let stars = '☆☆☆☆☆';
    if (percentage >= 90) stars = '⭐⭐⭐⭐⭐';
    else if (percentage >= 70) stars = '⭐⭐⭐⭐☆';
    else if (percentage >= 50) stars = '⭐⭐⭐☆☆';
    else if (percentage >= 30) stars = '⭐⭐☆☆☆';
    else if (percentage > 0) stars = '⭐☆☆☆☆';

    const starRatingEl = document.querySelector('.star-rating');
    if (starRatingEl) starRatingEl.textContent = stars;

    // Mastered words list
    const masteredList = document.getElementById('mastered-words-list');
    if (masteredList) {
      if (masteredWords.length > 0) {
        masteredList.innerHTML = masteredWords.map(w =>
          `<span class="word-tag mastered">${w.word}</span>`
        ).join('');
      } else {
        masteredList.innerHTML = '<div class="empty-message">아직 학습한 단어가 없어요</div>';
      }
    }

    // Review words list
    const reviewList = document.getElementById('review-words-list');
    if (reviewList) {
      if (wordsToReview.length > 0) {
        reviewList.innerHTML = wordsToReview.map(w =>
          `<span class="word-tag review">${w.word}</span>`
        ).join('');
      } else {
        reviewList.innerHTML = '<div class="empty-message">복습할 단어가 없어요! 🎉</div>';
      }
    }
  }

  // ==================== Progress Management ====================
  loadProgress() {
    const saved = localStorage.getItem(`book_progress_${this.bookData.id}`);
    if (saved) {
      this.progress = JSON.parse(saved);
    } else {
      this.progress = {
        lastReadSentence: -1,
        vocabulary: {}
      };
    }
  }

  saveProgress() {
    localStorage.setItem(`book_progress_${this.bookData.id}`, JSON.stringify(this.progress));
  }

  updateProgress() {
    this.updateReadProgress(this.progress.lastReadSentence || 0);
  }
}

// Helper function to initialize book reader
function initBookReader(bookData) {
  return new BookReader(bookData);
}
