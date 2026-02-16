/**
 * Book Reader Base Library
 * Shared JavaScript for all book reader pages
 * Uses Web Speech API for TTS (no API key required)
 * Optional: ElevenLabs API for high-quality voices
 */

class SimpleAudioCache {
  constructor(dbName = 'tts_cache_db', storeName = 'audio_files') {
    this.dbName = dbName;
    this.storeName = storeName;
    this.db = null;
    this.init();
  }

  init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = (event) => {
        console.error('AudioCache DB error:', event.target.error);
        reject(event.target.error);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };
    });
  }

  async get(key) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put(key, blob) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(blob, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

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

    // ElevenLabs Settings
    const configKey = (window.ELEVENLABS_CONFIG && window.ELEVENLABS_CONFIG.apiKey) || '';
    this.elevenLabsKey = localStorage.getItem('elevenlabs_api_key') || configKey;
    this.elevenLabsVoiceId = localStorage.getItem('elevenlabs_voice_id') || '21m00Tcm4TlvDq8ikWAM'; // Default: Rachel
    this.useElevenLabs = localStorage.getItem('use_elevenlabs') === 'true';
    this.audioCache = new SimpleAudioCache();

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
      if (voices.length === 0) return;

      console.log('Available voices:', voices.length);

      // High-quality American English voices priority
      const priorities = [
        v => v.name.includes('Aria') && v.name.includes('Natural'), // Edge Natural Aria
        v => v.name.includes('Google US English'),                   // Chrome Google US
        v => v.name.includes('Guy') && v.name.includes('Natural'),  // Edge Natural Guy
        v => v.name.includes('Google') && v.lang.includes('en-US'),  // Generic Google US
        v => v.lang.includes('en-US') && v.name.includes('Online'),  // Other Online voices
        v => v.lang.includes('en-US'),                               // Generic en-US (iOS Samantha etc)
        v => v.lang.startsWith('en'),                                // Any English
      ];

      for (const check of priorities) {
        this.selectedVoice = voices.find(check);
        if (this.selectedVoice) break;
      }

      if (this.selectedVoice) {
        console.log('TTS voice selected:', this.selectedVoice.name);
      } else {
        console.warn('No English TTS voice found.');
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
    this.setupSettings(); // Add settings UI
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

  // ==================== Settings UI ====================
  setupSettings() {
    // Create Settings Button
    const header = document.querySelector('.header-controls') || document.body;
    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'control-btn settings-btn';
    settingsBtn.innerHTML = '⚙️ 설정';
    settingsBtn.style.marginLeft = '10px';
    settingsBtn.onclick = () => this.openSettingsModal();

    // Insert button - try to find a good place
    const speedControl = document.querySelector('.speed-control');
    if (speedControl && speedControl.parentNode) {
      speedControl.parentNode.insertBefore(settingsBtn, speedControl.nextSibling);
    } else {
      header.appendChild(settingsBtn);
    }

    // Create Modal HTML
    const modalHtml = `
      <div id="settings-modal" class="modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center;">
        <div class="modal-content" style="background: white; padding: 20px; border-radius: 15px; width: 90%; max-width: 400px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="margin-top: 0; color: #4A5568;">설정 (Settings)</h2>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">TTS 엔진</label>
            <div style="display: flex; gap: 10px;">
              <label><input type="radio" name="tts-engine" value="web" ${!this.useElevenLabs ? 'checked' : ''}> Web Speech API (무료)</label>
              <label><input type="radio" name="tts-engine" value="elevenlabs" ${this.useElevenLabs ? 'checked' : ''}> ElevenLabs (고품질)</label>
            </div>
          </div>

          <div id="elevenlabs-settings" style="display: ${this.useElevenLabs ? 'block' : 'none'}; margin-bottom: 20px; padding: 10px; background: #F7FAFC; border-radius: 8px;">
            <div style="margin-bottom: 10px;">
              <label style="display: block; margin-bottom: 5px; font-size: 0.9em;">API Key</label>
              <input type="password" id="elevenlabs-key" value="${this.elevenLabsKey}" placeholder="Arguments: xi-api-key" style="width: 100%; padding: 8px; border: 1px solid #E2E8F0; border-radius: 4px;">
              <p style="font-size: 0.8em; color: #718096; margin-top: 5px;">
                ${window.ELEVENLABS_CONFIG ? '✅ config.js에서 로드됨' : '* 로컬 브라우저에만 저장됩니다.'}
              </p>
            </div>
            
            <div style="margin-bottom: 10px;">
              <label style="display: block; margin-bottom: 5px; font-size: 0.9em;">목소리 선택</label>
              <select id="elevenlabs-voice" style="width: 100%; padding: 8px; border: 1px solid #E2E8F0; border-radius: 4px;">
                <option value="21m00Tcm4TlvDq8ikWAM" ${this.elevenLabsVoiceId === '21m00Tcm4TlvDq8ikWAM' ? 'selected' : ''}>Rachel (American, Clear)</option>
                <option value="2EiwWnXFnvU5JabPnv8n" ${this.elevenLabsVoiceId === '2EiwWnXFnvU5JabPnv8n' ? 'selected' : ''}>Clyde (American, Deep)</option>
                <!-- The Chill Californian ID unknown, using placeholder if needed -->
              </select>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button id="close-settings" style="padding: 8px 16px; background: #EDF2F7; border: none; border-radius: 4px; cursor: pointer;">취소</button>
            <button id="save-settings" style="padding: 8px 16px; background: #48BB78; color: white; border: none; border-radius: 4px; cursor: pointer;">저장</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Event Listeners
    const modal = document.getElementById('settings-modal');
    const radioInputs = document.querySelectorAll('input[name="tts-engine"]');
    const elSettings = document.getElementById('elevenlabs-settings');
    const closeBtn = document.getElementById('close-settings');
    const saveBtn = document.getElementById('save-settings');

    radioInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        elSettings.style.display = e.target.value === 'elevenlabs' ? 'block' : 'none';
      });
    });

    closeBtn.onclick = () => modal.style.display = 'none';

    saveBtn.onclick = () => {
      const useEl = document.querySelector('input[name="tts-engine"]:checked').value === 'elevenlabs';
      const key = document.getElementById('elevenlabs-key').value;
      const voice = document.getElementById('elevenlabs-voice').value;

      this.useElevenLabs = useEl;
      this.elevenLabsKey = key;
      this.elevenLabsVoiceId = voice;

      localStorage.setItem('use_elevenlabs', useEl);
      localStorage.setItem('elevenlabs_api_key', key);
      localStorage.setItem('elevenlabs_voice_id', voice);

      alert('설정이 저장되었습니다.');
      modal.style.display = 'none';
    };
  }

  openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
      modal.style.display = 'flex';
      // Reset fields to current values
      document.getElementById('elevenlabs-key').value = this.elevenLabsKey;
      document.querySelector(`input[name="tts-engine"][value="${this.useElevenLabs ? 'elevenlabs' : 'web'}"]`).checked = true;
      document.getElementById('elevenlabs-settings').style.display = this.useElevenLabs ? 'block' : 'none';
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
    try {
      await this.speakText(sentence.en);
    } catch (e) {
      console.error("Playback failed", e);
    } finally {
      this.isPlaying = false;
      card.classList.remove('playing'); // Optional: remove playing state when done
    }

    // Update progress
    this.updateReadProgress(index);
    this.saveProgress();
  }

  async speakText(text) {
    // 1. ElevenLabs Check
    if (this.useElevenLabs && this.elevenLabsKey) {
      try {
        await this.playElevenLabsAudio(text);
        return;
      } catch (error) {
        console.error('ElevenLabs failed, falling back to Web Speech API:', error);
        // Fallback continues below
      }
    }

    // 2. Web Speech API (Fallback or Primary)
    return new Promise((resolve, reject) => {
      try {
        if (!this.selectedVoice) {
          // Retry voice selection logic
          const voices = speechSynthesis.getVoices();
          const priorities = [
            v => v.name.includes('Aria') && v.name.includes('Natural'),
            v => v.name.includes('Google US English'),
            v => v.name.includes('Guy') && v.name.includes('Natural'),
            v => v.name.includes('Google') && v.lang.includes('en-US'),
            v => v.lang.includes('en-US'),
            v => v.lang.startsWith('en'),
          ];
          for (const check of priorities) {
            this.selectedVoice = voices.find(check);
            if (this.selectedVoice) break;
          }
        }

        if (!this.selectedVoice) {
          console.warn('No English voice available. Skipping speech.');
          resolve();
          return;
        }

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

        // Fix for some browser quirks
        setTimeout(() => {
          speechSynthesis.speak(utterance);
        }, 10);

      } catch (error) {
        console.error('Web Speech TTS Error:', error);
        resolve();
      }
    });
  }

  async playElevenLabsAudio(text) {
    const cacheKey = `el_${this.elevenLabsVoiceId}_${text.substring(0, 20)}_${text.length}`; // Simple hash

    // Check Cache
    try {
      const cachedBlob = await this.audioCache.get(cacheKey);
      if (cachedBlob) {
        console.log('Playing from cache');
        await this.playAudioBlob(cachedBlob);
        return;
      }
    } catch (e) {
      console.warn('Cache read error:', e);
    }

    // Fetch from API
    console.log('Fetching from ElevenLabs...');
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.elevenLabsVoiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.elevenLabsKey
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_flash_v2_5", // Using Flash v2.5 for speed/cost
        voice_settings: {
          stability: 0.55,       // 55%
          similarity_boost: 0.8, // 80% for clarity
          style: 0,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ElevenLabs API Error: ${response.status} ${errText}`);
    }

    const blob = await response.blob();

    // Save to Cache
    try {
      await this.audioCache.put(cacheKey, blob);
    } catch (e) {
      console.warn('Cache write error:', e);
    }

    await this.playAudioBlob(blob);
  }

  async playAudioBlob(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.playbackRate = this.speed; // Apply speed header setting if possible, or just HTML5 audio playbackRate

      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };

      audio.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };

      audio.play().catch(reject);
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

        // If we want real-time speed adjustment during playback, we'd need to access the current Audio object,
        // but for now, it applies to the next playback.
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
    const totalSentencesEl = document.getElementById('total-sentences');
    if (totalSentencesEl) totalSentencesEl.textContent = this.bookData.story.length;

    const completedSentencesEl = document.getElementById('completed-sentences');
    if (completedSentencesEl) completedSentencesEl.textContent = (this.progress.lastReadSentence || 0) + 1;

    const masteredWordsEl = document.getElementById('mastered-words');
    if (masteredWordsEl) masteredWordsEl.textContent = masteredWords.length;

    const totalWordsEl = document.getElementById('total-words');
    if (totalWordsEl) totalWordsEl.textContent = totalWords;

    // Star rating
    const ratingEl = document.querySelector('.star-rating');
    if (ratingEl) {
      const percentage = totalWords > 0 ? (masteredWords.length / totalWords) * 100 : 0;
      let stars = '☆☆☆☆☆';
      if (percentage >= 90) stars = '⭐⭐⭐⭐⭐';
      else if (percentage >= 70) stars = '⭐⭐⭐⭐☆';
      else if (percentage >= 50) stars = '⭐⭐⭐☆☆';
      else if (percentage >= 30) stars = '⭐⭐☆☆☆';
      else if (percentage > 0) stars = '⭐☆☆☆☆';
      ratingEl.textContent = stars;
    }

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
