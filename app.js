/**
 * VoiceUZ — Next-Gen Real-Time Voice AI (TTS & STT)
 * Interactive Engine & Audio Visualizer
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initHeroVisualizer();
  initVoiceStudio();
  initSTTSimulator();
  initCodeTabs();
  initBenchmarkObserver();
});

/* ==========================================================================
   1. Navbar Scroll Effect & Mobile Menu
   ========================================================================== */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelector('.nav-links');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = navLinks.style.display === 'flex';
      navLinks.style.display = isOpen ? 'none' : 'flex';
      if (!isOpen) {
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '70px';
        navLinks.style.left = '0';
        navLinks.style.right = '0';
        navLinks.style.background = '#080A10';
        navLinks.style.padding = '24px';
        navLinks.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
      }
    });
  }
}

/* ==========================================================================
   2. Hero Canvas Audio Spectrum Visualizer
   ========================================================================== */
let isAudioPlayingGlobally = false;

function initHeroVisualizer() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let animationId;
  let phase = 0;

  function resize() {
    canvas.width = canvas.parentElement.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.parentElement.clientHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  window.addEventListener('resize', resize);
  resize();

  const numBars = 64;
  const barHeights = new Float32Array(numBars).fill(10);

  function draw() {
    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;

    ctx.clearRect(0, 0, width, height);

    phase += isAudioPlayingGlobally ? 0.08 : 0.03;

    // Draw multiple layered flowing waves
    const layers = [
      { color: 'rgba(0, 240, 255, 0.4)', freq: 0.015, amp: isAudioPlayingGlobally ? 35 : 16, speed: 1.0 },
      { color: 'rgba(157, 78, 221, 0.35)', freq: 0.02, amp: isAudioPlayingGlobally ? 42 : 18, speed: -1.2 },
      { color: 'rgba(255, 46, 147, 0.25)', freq: 0.012, amp: isAudioPlayingGlobally ? 28 : 12, speed: 0.8 },
    ];

    layers.forEach(layer => {
      ctx.beginPath();
      ctx.moveTo(0, height / 2);

      for (let x = 0; x <= width; x += 4) {
        const y = height / 2 + Math.sin(x * layer.freq + phase * layer.speed) * layer.amp
                          * Math.sin(x / width * Math.PI); // Envelope edges to 0
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = layer.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    });

    // Draw central spectral bars
    const barWidth = (width - (numBars * 3)) / numBars;
    const centerY = height / 2;

    for (let i = 0; i < numBars; i++) {
      const targetHeight = isAudioPlayingGlobally
        ? (Math.sin(i * 0.2 + phase * 2) * 0.5 + 0.5) * (height * 0.7) + 8
        : (Math.sin(i * 0.15 + phase) * 0.5 + 0.5) * (height * 0.25) + 4;

      barHeights[i] += (targetHeight - barHeights[i]) * 0.15;

      const x = i * (barWidth + 3);
      const h = barHeights[i];
      const y = centerY - h / 2;

      // Gradient for each bar
      const grad = ctx.createLinearGradient(0, y, 0, y + h);
      grad.addColorStop(0, '#00F0FF');
      grad.addColorStop(0.5, '#9D4EDD');
      grad.addColorStop(1, '#FF2E93');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, Math.max(barWidth, 2), h, 2);
      ctx.fill();
    }

    animationId = requestAnimationFrame(draw);
  }

  draw();
}

/* ==========================================================================
   3. Interactive Voice Studio (TTS Player)
   ========================================================================== */
const VOICES = {
  muslima_natural: {
    name: 'Muslima (Natural)',
    lang: 'Uzbek (Native)',
    accent: 'Tashkent Standard',
    tag: 'Warm & Melodic',
    file: 'audio/muslima_natural.wav',
    preset: "Assalomu alaykum! VoiceUZ platformasiga xush kelibsiz. Bizning neyron tarmoqlarimiz orqali o'zbek tilidagi nutq soniyaning bir lahzasida juda tiniq va tabiiy yangraydi."
  },
  muslima_studio: {
    name: 'Muslima (Studio Hi-Fi)',
    lang: 'Uzbek (Native)',
    accent: 'Broadcast Standard',
    tag: 'Studio Mastered',
    file: 'audio/muslima_studio.wav',
    preset: "VoiceUZ — bu real vaqt rejimida 100-200 millisoniyada javob beruvchi eng zamonaviy nutq sun'iy intellekti platformasidir."
  },
  conversational_agent: {
    name: 'Atlas (Agentic Dialog)',
    lang: 'Multilingual / Uzbek',
    accent: 'Dynamic Assistant',
    tag: 'Ultra-Responsive',
    file: 'audio/conversational_agent.wav',
    preset: "Hello! I am your real-time conversational agent powered by VoiceUZ. I can understand your speech and answer back with zero awkward pauses."
  },
  fast_inference: {
    name: 'Turbo (Edge Inference)',
    lang: 'Uzbek / English',
    accent: 'Crisp & Direct',
    tag: 'Sub-120ms Latency',
    file: 'audio/fast_inference.wav',
    preset: "Neyron modellarimiz CUDA grafi optimallashtirilgan bo'lib, har bir so'z streaming holatida uzatiladi."
  }
};

let currentAudio = null;
let currentVoiceId = 'muslima_natural';
let isPlaying = false;

function initVoiceStudio() {
  const voiceCards = document.querySelectorAll('.voice-card');
  const textarea = document.getElementById('ttsInputText');
  const playBtn = document.getElementById('ttsPlayBtn');
  const playerDeck = document.querySelector('.player-deck');
  const playerVoiceName = document.getElementById('playerVoiceName');
  const playerAudioTime = document.getElementById('playerAudioTime');
  const playerLatency = document.getElementById('playerLatency');
  const presetChips = document.querySelectorAll('.preset-chip');

  // Studio tabs (TTS vs STT)
  const tabBtns = document.querySelectorAll('.studio-tab-btn');
  const tabPanels = document.querySelectorAll('.studio-content-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(target).classList.add('active');

      if (isPlaying && currentAudio) {
        currentAudio.pause();
        isPlaying = false;
        isAudioPlayingGlobally = false;
        playerDeck.classList.remove('playing');
        playBtn.innerHTML = '▶';
      }
    });
  });

  // Select voice card
  voiceCards.forEach(card => {
    card.addEventListener('click', () => {
      voiceCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      currentVoiceId = card.dataset.voice;

      const voice = VOICES[currentVoiceId];
      if (voice) {
        if (textarea) textarea.value = voice.preset;
        if (playerVoiceName) playerVoiceName.textContent = voice.name;

        // Stop previous audio
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
        isPlaying = false;
        isAudioPlayingGlobally = false;
        playerDeck.classList.remove('playing');
        playBtn.innerHTML = '▶';
        if (playerAudioTime) playerAudioTime.textContent = '00:00 / 00:00';
      }
    });
  });

  // Preset chips
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      presetChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const text = chip.dataset.text;
      if (text && textarea) textarea.value = text;
    });
  });

  // Play / Pause button
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      toggleAudioPlayback(playBtn, playerDeck, playerAudioTime, playerLatency);
    });
  }
}

function toggleAudioPlayback(playBtn, playerDeck, timeDisplay, latencyDisplay) {
  const voice = VOICES[currentVoiceId];
  if (!voice) return;

  if (isPlaying && currentAudio) {
    currentAudio.pause();
    isPlaying = false;
    isAudioPlayingGlobally = false;
    playerDeck.classList.remove('playing');
    playBtn.innerHTML = '▶';
    return;
  }

  // Create or reuse audio element
  if (!currentAudio || currentAudio.src !== location.origin + '/' + voice.file) {
    currentAudio = new Audio(voice.file);

    currentAudio.addEventListener('loadedmetadata', () => {
      updateTimeDisplay(currentAudio, timeDisplay);
    });

    currentAudio.addEventListener('timeupdate', () => {
      updateTimeDisplay(currentAudio, timeDisplay);
    });

    currentAudio.addEventListener('ended', () => {
      isPlaying = false;
      isAudioPlayingGlobally = false;
      playerDeck.classList.remove('playing');
      playBtn.innerHTML = '▶';
      if (timeDisplay) timeDisplay.textContent = '00:00 / ' + formatSeconds(currentAudio.duration);
    });

    currentAudio.addEventListener('error', () => {
      console.warn('Local WAV file error, falling back to Web Audio synthesis');
      synthesizeFallbackAudio(playBtn, playerDeck, timeDisplay);
    });
  }

  // Simulate ultra-low latency timing
  const randomLatency = Math.floor(Math.random() * 25) + 115; // 115-140ms
  if (latencyDisplay) latencyDisplay.textContent = `${randomLatency} ms`;

  currentAudio.play().then(() => {
    isPlaying = true;
    isAudioPlayingGlobally = true;
    playerDeck.classList.add('playing');
    playBtn.innerHTML = '❚❚';
  }).catch(err => {
    console.warn('Playback error:', err);
    synthesizeFallbackAudio(playBtn, playerDeck, timeDisplay);
  });
}

function updateTimeDisplay(audio, display) {
  if (!display || !audio.duration) return;
  display.textContent = `${formatSeconds(audio.currentTime)} / ${formatSeconds(audio.duration)}`;
}

function formatSeconds(secs) {
  if (isNaN(secs)) return '00:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

// Fallback synthesizer using Web Audio API if browser restricts file protocols
function synthesizeFallbackAudio(playBtn, playerDeck, timeDisplay) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 1.2);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.5);

    isPlaying = true;
    isAudioPlayingGlobally = true;
    playerDeck.classList.add('playing');
    playBtn.innerHTML = '❚❚';

    setTimeout(() => {
      isPlaying = false;
      isAudioPlayingGlobally = false;
      playerDeck.classList.remove('playing');
      playBtn.innerHTML = '▶';
    }, 1500);
  } catch (e) {
    console.error(e);
  }
}

/* ==========================================================================
   4. Interactive Streaming STT Simulator
   ========================================================================== */
const SAMPLE_STREAM_SENTENCES = [
  "Assalomu alaykum, VoiceUZ tizimi real vaqtda ovozni matnga aylantirishni boshladi.",
  "Model 120 millisoniya kechikish bilan o'zbek tilidagi barcha fonemalarni aniq taniydi.",
  "Har bir so'z streaming protokoli orqali darhol ekranga uzatiladi va tinish belgilari avtomatik qo'yiladi.",
  "Enterprise darajasidagi xavfsizlik va yuqori aniqlik 99.4 foiz darajasida ta'minlangan."
];

function initSTTSimulator() {
  const micCard = document.getElementById('sttMicCard');
  const transcriptEl = document.getElementById('sttTranscriptText');
  const latencyBadge = document.getElementById('sttLatencyBadge');
  const confidenceBadge = document.getElementById('sttConfidenceBadge');

  if (!micCard || !transcriptEl) return;

  let isStreaming = false;
  let streamTimer = null;
  let sentenceIndex = 0;

  micCard.addEventListener('click', () => {
    isStreaming = !isStreaming;

    if (isStreaming) {
      micCard.classList.add('active');
      isAudioPlayingGlobally = true;
      startStreamingSimulation(transcriptEl, latencyBadge, confidenceBadge);
    } else {
      micCard.classList.remove('active');
      isAudioPlayingGlobally = false;
      clearInterval(streamTimer);
    }
  });

  function startStreamingSimulation(outputEl, latEl, confEl) {
    const text = SAMPLE_STREAM_SENTENCES[sentenceIndex % SAMPLE_STREAM_SENTENCES.length];
    sentenceIndex++;
    const words = text.split(' ');
    let wordIdx = 0;

    outputEl.innerHTML = '<span class="text-dim">Listening to incoming audio stream...</span>';

    streamTimer = setInterval(() => {
      if (wordIdx >= words.length) {
        clearInterval(streamTimer);
        // Continue after brief pause if still active
        setTimeout(() => {
          if (isStreaming) startStreamingSimulation(outputEl, latEl, confEl);
        }, 1500);
        return;
      }

      const currentWords = words.slice(0, wordIdx + 1);
      const latestWord = currentWords[currentWords.length - 1];
      const previousWords = currentWords.slice(0, -1).join(' ');

      outputEl.innerHTML = `${previousWords ? previousWords + ' ' : ''}<span class="word-latest">${latestWord}</span>`;

      // Jitter latency slightly (98ms - 135ms)
      const lat = Math.floor(Math.random() * 37) + 98;
      if (latEl) latEl.textContent = `Latency: ${lat}ms`;

      // Confidence (98.9% - 99.8%)
      const conf = (98.9 + Math.random() * 0.9).toFixed(1);
      if (confEl) confEl.textContent = `Accuracy: ${conf}%`;

      wordIdx++;
    }, 240); // 240ms per word cadence
  }
}

/* ==========================================================================
   5. Developer Hub Code Tabs & Copy
   ========================================================================== */
function initCodeTabs() {
  const langTabs = document.querySelectorAll('.lang-tab');
  const codeSnippets = document.querySelectorAll('.code-snippet');
  const copyBtn = document.getElementById('copyCodeBtn');

  langTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetLang = tab.dataset.lang;

      langTabs.forEach(t => t.classList.remove('active'));
      codeSnippets.forEach(s => s.classList.remove('active'));

      tab.classList.add('active');
      const activeSnippet = document.getElementById(`snippet-${targetLang}`);
      if (activeSnippet) activeSnippet.classList.add('active');
    });
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const activeSnippet = document.querySelector('.code-snippet.active code');
      if (activeSnippet) {
        navigator.clipboard.writeText(activeSnippet.innerText).then(() => {
          const originalText = copyBtn.innerHTML;
          copyBtn.innerHTML = '✓ Copied!';
          copyBtn.style.borderColor = '#10B981';
          copyBtn.style.color = '#10B981';

          setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.style.borderColor = '';
            copyBtn.style.color = '';
          }, 2000);
        });
      }
    });
  }
}

/* ==========================================================================
   6. Benchmark Observer (Animated Bars on Scroll)
   ========================================================================== */
function initBenchmarkObserver() {
  const chartBars = document.querySelectorAll('.chart-bar-fill');
  if (!chartBars.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        chartBars.forEach(bar => {
          const targetWidth = bar.dataset.width;
          if (targetWidth) bar.style.width = targetWidth;
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  const chartCard = document.querySelector('.benchmark-chart-card');
  if (chartCard) observer.observe(chartCard);
}
