/**
 * Book Reader Base Library
 * Shared JavaScript for all book reader pages
 * Uses Web Speech API for TTS (no API key required)
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
    this.selectedVoice = null;

    // Load saved progress
    this.loadProgress();

    // Initialize voices
    this.initVoices();

    // Initialize
    this.init();
  }

  // Initialize TTS voices
  initVoices() {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();

      // High-quality American English voices priority
      const priorities = [
        v => v.name.includes('Aria') && v.name.includes('Natural'), // Edge Natural Aria
        v => v.name.includes('Google US English'),                   // Chrome Google US
        v => v.name.includes('Guy') && v.name.includes('Natural'),  // Edge Natural Guy
        v => v.name.includes('Google') && v.lang.includes('en-US'),  // Generic Google US
        v => v.lang === 'en-US' && v.name.includes('Online'),        // Other Online voices
      ];

      for (const check of priorities) {
        this.selectedVoice = voices.find(check);
        if (this.selectedVoice) break;
      }

      if (this.selectedVoice) {
        console.log('High-quality TTS voice selected:', this.selectedVoice.name);
      } else {
        console.warn('High-quality American English TTS voice not found.');
      }
    };

    // Voices may load asynchronously
    if (speechSynthesis.getVoices().length > 0) {
      loadVoices();
    }

    // Always attach listener as voices can change or load late
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
  }

  init() {
    this.createStars();
    this.setupTabs();
    this.setupReadMode();
    this.setupWordMode();
    this.setupReviewMode();
    this.setupSpeedControl();
    this.updateProgress();
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

    // Play TTS
    this.isPlaying = true;
    await this.speakText(sentence.en);
    this.isPlaying = false;

    // Update progress
    this.updateReadProgress(index);
    this.saveProgress();
  }

  async speakText(text) {
    return new Promise((resolve, reject) => {
      try {
        if (!this.selectedVoice) {
          console.warn('High-quality voice not available. Skipping speech.');
          resolve();
          return;
        }

        // Cancel any ongoing speech
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = this.speed;
        utterance.pitch = 1.0;
        utterance.voice = this.selectedVoice;

        utterance.onend = () => resolve();
        utterance.onerror = (e) => {
          console.error('TTS Error:', e);
          resolve();
        };

        speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('TTS Error:', error);
        resolve();
      }
    });
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

    if (knowBtn) knowBtn.addEventListener('click', () => this.answerWord(true));
    if (studyBtn) studyBtn.addEventListener('click', () => this.answerWord(false));
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
    this.speakText(this.currentWordData.word);
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
    const wordsToReview = this.getWordsToReview();
    this.currentWord++;

    if (this.currentWord < wordsToReview.length) {
      this.currentWordData = wordsToReview[this.currentWord];
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
    document.getElementById('total-sentences').textContent = this.bookData.story.length;
    document.getElementById('completed-sentences').textContent = (this.progress.lastReadSentence || 0) + 1;
    document.getElementById('mastered-words').textContent = masteredWords.length;
    document.getElementById('total-words').textContent = totalWords;

    // Star rating
    const percentage = totalWords > 0 ? (masteredWords.length / totalWords) * 100 : 0;
    let stars = '☆☆☆☆☆';
    if (percentage >= 90) stars = '⭐⭐⭐⭐⭐';
    else if (percentage >= 70) stars = '⭐⭐⭐⭐☆';
    else if (percentage >= 50) stars = '⭐⭐⭐☆☆';
    else if (percentage >= 30) stars = '⭐⭐☆☆☆';
    else if (percentage > 0) stars = '⭐☆☆☆☆';

    document.querySelector('.star-rating').textContent = stars;

    // Mastered words list
    const masteredList = document.getElementById('mastered-words-list');
    if (masteredWords.length > 0) {
      masteredList.innerHTML = masteredWords.map(w =>
        `<span class="word-tag mastered">${w.word}</span>`
      ).join('');
    } else {
      masteredList.innerHTML = '<div class="empty-message">아직 학습한 단어가 없어요</div>';
    }

    // Review words list
    const reviewList = document.getElementById('review-words-list');
    if (wordsToReview.length > 0) {
      reviewList.innerHTML = wordsToReview.map(w =>
        `<span class="word-tag review">${w.word}</span>`
      ).join('');
    } else {
      reviewList.innerHTML = '<div class="empty-message">복습할 단어가 없어요! 🎉</div>';
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
