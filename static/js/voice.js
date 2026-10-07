// static/js/voice.js — Studio Neural Acoustics & Speech Engine
(function () {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const synth = window.speechSynthesis;

  let recognition = null;
  let isListening = false;
  let activeUtterance = null;
  let cachedVoices = [];

  // Default voice gender: 'female' | 'male'
  window.voiceGender = localStorage.getItem("voxbridge_voice_gender") || "female";

  window.setVoiceGender = function (gender) {
    if (gender === "male" || gender === "female") {
      window.voiceGender = gender;
      try {
        localStorage.setItem("voxbridge_voice_gender", gender);
      } catch (e) {}
    }
  };

  const FEMALE_VOICE_NAMES = [
    "female", "woman", "zira", "samantha", "victoria", "karen", "susan", "fiona",
    "tessa", "alice", "veena", "lekha", "amelie", "hortense", "monica", "helena",
    "laura", "anna", "kyoko", "tingting", "yuna", "milena", "yelena", "alva",
    "klara", "joana", "luciana", "miren", "sin-ji", "mei-jia", "kanya", "damayanti",
    "paulina", "marta", "sara", "clara", "elsa", "katja", "charlotte", "ava", "allison"
  ];

  const MALE_VOICE_NAMES = [
    "male", "man", "david", "mark", "george", "alex", "fred", "daniel", "oliver",
    "rishi", "thomas", "nicolas", "diego", "jorge", "juan", "stefan", "yuri",
    "dmitri", "oto", "tarik", "carlos", "magnus", "henrik", "arthur"
  ];

  // Populate browser voices
  function loadVoices() {
    if (!synth) return;
    cachedVoices = synth.getVoices() || [];
  }
  if (synth) {
    loadVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
  }

  // Mapping language short codes to common voice name keywords across OS/browsers
  const LANG_VOICE_NAME_HINTS = {
    ko: ["korean", "한국어", "ko-kr", "ko_kr", "yuna", "sun-hi", "injoon", "seoyeon", "hyhyun"],
    ja: ["japanese", "日本語", "ja-jp", "kyoko", "otoya", "naoki"],
    te: ["telugu", "తెలుగు", "te-in", "te_in", "mohan", "chitra", "geetha", "shruti"],
    ta: ["tamil", "தமிழ்", "ta-in", "ta_in", "valluvar", "latha", "vani"],
    ml: ["malayalam", "മലയാളം", "ml-in", "ml_in", "midhun", "ananya", "lekha", "sobana"],
    kn: ["kannada", "ಕನ್ನಡ", "kn-in", "kn_in", "sapna", "gagan"],
    hi: ["hindi", "हिन्दी", "hi-in", "hi_in", "swara", "madhur", "kalpana", "hemant", "veena", "lekha"],
    bn: ["bengali", "বাংলা", "bn-in", "bn_in", "bn-bd", "tanishaa", "bashkar"],
    mr: ["marathi", "मराठी", "mr-in", "mr_in", "aarohi", "manohar"],
    gu: ["gujarati", "ગુજરાતી", "gu-in", "gu_in", "dhwani", "niranjan"],
    pa: ["punjabi", "ਪੰਜਾਬੀ", "pa-in", "pa_in", "gurpreet", "harpreet"],
    ur: ["urdu", "اردو", "ur-pk", "ur_pk", "ur-in", "uzma", "asad"],
    ne: ["nepali", "नेपाली", "ne-np"],
    si: ["sinhala", "සිංහල", "si-lk"],
    es: ["spanish", "español", "castellano", "es-es", "es-mx"],
    fr: ["french", "français", "fr-fr", "fr-ca"],
    de: ["german", "deutsch", "de-de"],
    zh: ["chinese", "mandarin", "中文", "zh-cn", "zh-tw", "tingting"],
    ar: ["arabic", "العربية", "ar-sa", "ar-ae", "ar-eg", "maged", "tarik"],
    pt: ["portuguese", "português", "pt-br", "pt-pt"],
    ru: ["russian", "русский", "ru-ru"],
    it: ["italian", "italiano", "it-it"],
    nl: ["dutch", "nederlands", "nl-nl"],
    tr: ["turkish", "türkçe", "tr-tr"],
    vi: ["vietnamese", "tiếng việt", "vi-vn"],
    th: ["thai", "ไทย", "th-th"],
    id: ["indonesian", "bahasa", "id-id"],
    ms: ["malay", "bahasa melayu", "ms-my"],
    fil: ["filipino", "tagalog", "fil-ph"],
    sw: ["swahili", "kiswahili", "sw-ke"],
    pl: ["polish", "polski", "pl-pl"],
    uk: ["ukrainian", "українська", "uk-ua"],
    el: ["greek", "ελληνικά", "el-gr"],
    en: ["english", "en-us", "en-gb", "en-in"],
  };

  // Find best matching voice for BCP-47 and preferred gender
  function getBestVoice(langCode, genderPreference) {
    loadVoices();
    if (!cachedVoices.length) return null;

    const lower = (langCode || "en-US").toLowerCase().replace(/_/g, "-");
    const short = lower.split("-")[0];
    const pref = (genderPreference || window.voiceGender || "female").toLowerCase();
    const hints = LANG_VOICE_NAME_HINTS[short] || [short];

    // 1. Filter candidates matching the target language by code or name
    let langCandidates = cachedVoices.filter((v) => {
      const vLang = (v.lang || "").toLowerCase().replace(/_/g, "-");
      const vName = (v.name || "").toLowerCase();

      const codeMatch =
        vLang === lower ||
        vLang.startsWith(lower + "-") ||
        vLang.startsWith(short + "-") ||
        vLang === short;

      const nameMatch = hints.some((hint) => vName.includes(hint) || vLang.includes(hint));

      return codeMatch || nameMatch;
    });

    if (!langCandidates.length) {
      return null;
    }

    // 2. Select matching gender among candidates
    if (pref === "female") {
      const femaleVoice = langCandidates.find((v) => {
        const vName = v.name.toLowerCase();
        return (
          FEMALE_VOICE_NAMES.some((fn) => vName.includes(fn)) &&
          !MALE_VOICE_NAMES.some((mn) => vName.includes(mn))
        );
      });
      if (femaleVoice) return femaleVoice;
    } else if (pref === "male") {
      const maleVoice = langCandidates.find((v) => {
        const vName = v.name.toLowerCase();
        return (
          MALE_VOICE_NAMES.some((mn) => vName.includes(mn)) &&
          !FEMALE_VOICE_NAMES.some((fn) => vName.includes(fn))
        );
      });
      if (maleVoice) return maleVoice;
    }

    return langCandidates[0] || null;
  }

  let activeAudioElement = null;

  /* ================= TEXT TO SPEECH (SYNTHESIS & HYBRID TTS) ================= */
  window.speak = function (text, langCode, onEnd) {
    if (window.autoSpeak === false && !onEnd) return;

    window.stopSpeaking();

    const cleanText = text.replace(/[*_#`~[\]]/g, "").trim();
    if (!cleanText) return;

    const targetLang = langCode || (window.voiceLang && window.voiceLang !== "" ? window.voiceLang : "en-US");
    const shortCode = targetLang.split("-")[0].toLowerCase();
    const genderPref = (window.voiceGender || "female").toLowerCase();

    const voice = getBestVoice(targetLang, genderPref);

    const alwaysUseStreamingTTS = false;

    if (!voice && !synth) {
      playStreamingTTS(cleanText, shortCode, onEnd);
      return;
    }

    try {
      if (synth && synth.paused) synth.resume();
    } catch (e) {}

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = window.speechRate || 1.0;
    utterance.lang = targetLang;
    if (voice) {
      utterance.voice = voice;
    }

    if (genderPref === "male") {
      utterance.pitch = 0.8; // Distinct rich male voice tone
    } else {
      utterance.pitch = 1.15; // Bright female voice tone
    }

    let finished = false;
    const finishCallback = () => {
      if (finished) return;
      finished = true;
      activeUtterance = null;
      window.dispatchEvent(
        new CustomEvent("vox-speak-end", { detail: { text: cleanText, langCode: targetLang } })
      );

      if (typeof onEnd === "function") {
        onEnd();
      }

      if (window.handsFree && !isListening) {
        setTimeout(() => {
          if (window.handsFree && !isListening) {
            window.startVoiceRecognition();
          }
        }, 400);
      }
    };

    utterance.onstart = function () {
      activeUtterance = utterance;
      window.dispatchEvent(
        new CustomEvent("vox-speak-start", { detail: { text: cleanText, langCode: targetLang } })
      );
    };

    utterance.onend = finishCallback;

    utterance.onerror = function (err) {
      console.warn("Browser speech synthesis error, falling back to neural audio:", err);
      // Fallback to streaming TTS on error
      playStreamingTTS(cleanText, shortCode, onEnd);
    };

    synth.speak(utterance);
  };

  function playStreamingTTS(text, langShortCode, onEnd) {
    window.stopSpeaking();

    const ttsUrl = `/api/tts?text=${encodeURIComponent(text.substring(0, 300))}&lang=${encodeURIComponent(langShortCode)}&gender=${encodeURIComponent(window.voiceGender || 'female')}`;
    const audio = new Audio(ttsUrl);
    activeAudioElement = audio;

    audio.playbackRate = window.speechRate || 1.0;

    let finished = false;
    const finishAudio = () => {
      if (finished) return;
      finished = true;
      if (activeAudioElement === audio) {
        activeAudioElement = null;
      }
      window.dispatchEvent(
        new CustomEvent("vox-speak-end", { detail: { text, langCode: langShortCode } })
      );

      if (typeof onEnd === "function") {
        onEnd();
      }

      if (window.handsFree && !isListening) {
        setTimeout(() => {
          if (window.handsFree && !isListening) {
            window.startVoiceRecognition();
          }
        }, 400);
      }
    };

    audio.onplay = function () {
      window.dispatchEvent(
        new CustomEvent("vox-speak-start", { detail: { text, langCode: langShortCode } })
      );
    };

    audio.onended = finishAudio;
    audio.onerror = function (e) {
      console.warn("TTS audio streaming playback error:", e);
      finishAudio();
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn("Audio autoplay blocked or error:", err);
        finishAudio();
      });
    }
  }

  window.stopSpeaking = function () {
    if (activeAudioElement) {
      try {
        activeAudioElement.pause();
        activeAudioElement.currentTime = 0;
      } catch (e) {}
      activeAudioElement = null;
    }

    if (synth && (synth.speaking || synth.pending)) {
      synth.cancel();
      activeUtterance = null;
    }

    window.dispatchEvent(new CustomEvent("vox-speak-stop"));
  };

  window.isSpeaking = function () {
    const isSynthSpeaking = !!(synth && synth.speaking);
    const isAudioPlaying = !!(activeAudioElement && !activeAudioElement.paused);
    return isSynthSpeaking || isAudioPlaying;
  };

  /* ================= SPEECH TO TEXT (RECOGNITION WITH FALLBACK) ================= */
  let mediaRecorder = null;
  let audioChunks = [];
  let isRecording = false;
  let silenceCheckInterval = null;
  let maxRecordTimeout = null;
  let audioContext = null;
  let analyser = null;

  function cleanupRecordingResources(stream) {
    if (silenceCheckInterval) {
      clearInterval(silenceCheckInterval);
      silenceCheckInterval = null;
    }
    if (maxRecordTimeout) {
      clearTimeout(maxRecordTimeout);
      maxRecordTimeout = null;
    }
    if (audioContext) {
      try { audioContext.close(); } catch (e) {}
      audioContext = null;
    }
    analyser = null;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  }

  function startMediaRecorder() {
    if (isRecording) return;
    window.stopSpeaking();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      isRecording = false;
      isListening = false;
      window.dispatchEvent(
        new CustomEvent("vox-listen-error", { detail: { error: "not-supported", message: "Microphone access is not supported on this device/browser." } })
      );
      return;
    }

    // Enhanced audio constraints for studio voice clarity
    const audioConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    };

    navigator.mediaDevices.getUserMedia({ audio: audioConstraints })
      .then((stream) => {
        let selectedMime = "audio/webm";
        if (typeof MediaRecorder.isTypeSupported === "function") {
          if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
            selectedMime = "audio/webm;codecs=opus";
          } else if (MediaRecorder.isTypeSupported("audio/webm")) {
            selectedMime = "audio/webm";
          } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
            selectedMime = "audio/mp4";
          }
        }

        try {
          mediaRecorder = new MediaRecorder(stream, selectedMime ? { mimeType: selectedMime } : undefined);
        } catch (e) {
          mediaRecorder = new MediaRecorder(stream);
        }

        audioChunks = [];
        isRecording = true;
        isListening = true;

        window.dispatchEvent(new CustomEvent("vox-listen-start"));

        // Setup live audio silence detection via Web Audio API
        let hasSpokenAudio = false;
        let silenceStartTime = 0;
        try {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) {
            audioContext = new AudioCtx();
            const source = audioContext.createMediaStreamSource(stream);
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            silenceCheckInterval = setInterval(() => {
              if (!isRecording || !analyser) return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
              const avg = sum / dataArray.length;

              if (avg > 14) {
                hasSpokenAudio = true;
                silenceStartTime = 0;
              } else if (hasSpokenAudio) {
                if (!silenceStartTime) {
                  silenceStartTime = Date.now();
                } else if (Date.now() - silenceStartTime > 1100) {
                  // User finished speaking! Auto-stop quickly after 1.1s of silence
                  clearInterval(silenceCheckInterval);
                  silenceCheckInterval = null;
                  stopMediaRecorder();
                }
              }
            }, 100);
          }
        } catch (e) {}

        // Generous maximum timeout of 60 seconds
        maxRecordTimeout = setTimeout(() => {
          if (isRecording) {
            stopMediaRecorder();
          }
        }, 60000);

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          isRecording = false;
          isListening = false;
          cleanupRecordingResources(stream);

          const mime = mediaRecorder.mimeType || selectedMime || "audio/webm";
          const audioBlob = new Blob(audioChunks, { type: mime });

          if (audioBlob.size < 300) {
            window.dispatchEvent(new CustomEvent("vox-listen-end", { detail: { text: "" } }));
            return;
          }

          window.dispatchEvent(new CustomEvent("vox-transcribing-start"));

          // Convert to base64 and send to unified single-pass voice-chat endpoint for hyper-fast response
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64 = reader.result ? String(reader.result).split(",")[1] : "";
            if (!base64) {
              window.dispatchEvent(new CustomEvent("vox-listen-end", { detail: { text: "" } }));
              return;
            }

            const activeName = (window.voxCustomerName || "").trim();
            fetch("/api/voice-chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ audio: base64, mimeType: mime, name: activeName }),
            })
              .then((res) => {
                if (!res.ok) throw new Error("HTTP " + res.status);
                return res.json();
              })
              .then((data) => {
                if (data && data.reply) {
                  window.dispatchEvent(new CustomEvent("vox-voice-response", { detail: data }));
                } else if (data && data.text) {
                  window.dispatchEvent(new CustomEvent("vox-listen-end", { detail: { text: data.text } }));
                } else {
                  window.dispatchEvent(new CustomEvent("vox-listen-end", { detail: { text: "" } }));
                }
              })
              .catch((err) => {
                console.warn("Audio voice-chat error:", err);
                window.dispatchEvent(new CustomEvent("vox-listen-end", { detail: { text: "" } }));
              });
          };
        };

        // Start recording with 250ms chunks
        mediaRecorder.start(250);
      })
      .catch((err) => {
        isRecording = false;
        isListening = false;
        cleanupRecordingResources(null);

        const isPermissionDenied =
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError" ||
          err.name === "SecurityError" ||
          (err.message && err.message.toLowerCase().includes("permission"));

        if (isPermissionDenied) {
          window.dispatchEvent(
            new CustomEvent("vox-listen-error", {
              detail: { error: "permission-denied", message: "Microphone blocked. Click the lock icon in the address bar to Allow Microphone." }
            })
          );
        } else {
          window.dispatchEvent(
            new CustomEvent("vox-listen-error", {
              detail: { error: err.name || "Microphone Notice", message: err.message || "Microphone could not be started." }
            })
          );
        }
      });
  }

  function stopMediaRecorder() {
    if (silenceCheckInterval) {
      clearInterval(silenceCheckInterval);
      silenceCheckInterval = null;
    }
    if (maxRecordTimeout) {
      clearTimeout(maxRecordTimeout);
      maxRecordTimeout = null;
    }
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      try {
        if (typeof mediaRecorder.requestData === "function") {
          mediaRecorder.requestData();
        }
        mediaRecorder.stop();
      } catch (e) {}
    }
  }

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let accumulatedFinalText = "";
    let speechSilenceTimeout = null;

    recognition.onstart = function () {
      isListening = true;
      accumulatedFinalText = "";
      window.dispatchEvent(new CustomEvent("vox-listen-start"));
    };

    recognition.onresult = function (event) {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          accumulatedFinalText += (accumulatedFinalText ? " " : "") + transcript.trim();
        } else {
          interimTranscript += transcript;
        }
      }

      const liveText = (accumulatedFinalText + (interimTranscript ? " " + interimTranscript : "")).trim();

      window.dispatchEvent(
        new CustomEvent("vox-listen-result", {
          detail: {
            interim: interimTranscript,
            final: accumulatedFinalText,
            live: liveText,
          },
        })
      );

      // Fast responsiveness: 1.1s of silence before auto-submitting
      if (speechSilenceTimeout) clearTimeout(speechSilenceTimeout);
      if (liveText) {
        speechSilenceTimeout = setTimeout(() => {
          if (isListening && recognition) {
            try {
              recognition.stop();
            } catch (e) {}
          }
        }, 1100);
      }
    };

    recognition.onerror = function (event) {
      console.warn("Speech recognition error:", event.error);
      if (speechSilenceTimeout) clearTimeout(speechSilenceTimeout);
      isListening = false;
      if (event.error === "no-speech") {
        window.dispatchEvent(new CustomEvent("vox-listen-end", { detail: { text: "" } }));
        return;
      }
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        window.dispatchEvent(
          new CustomEvent("vox-listen-error", { detail: { error: event.error, message: "Microphone blocked. Click the lock icon in address bar to allow mic." } })
        );
        return;
      }
      // Fallback to MediaRecorder on other errors
      startMediaRecorder();
    };

    recognition.onend = function () {
      if (speechSilenceTimeout) clearTimeout(speechSilenceTimeout);
      if (!isRecording) {
        isListening = false;
        const textToEmit = accumulatedFinalText ? accumulatedFinalText.trim() : "";
        window.dispatchEvent(new CustomEvent("vox-listen-end", { detail: { text: textToEmit } }));
      }
    };
  }

  window.startVoiceRecognition = function () {
    if (isListening || isRecording) return;
    window.stopSpeaking();

    // 1. High-Speed Web Speech API for instant 0ms streaming
    if (recognition) {
      try {
        const preferred = (window.voiceLang && window.voiceLang.trim() !== "")
          ? window.voiceLang.trim()
          : "";
        recognition.lang = preferred;
        recognition.start();
        return;
      } catch (err) {
        console.warn("Speech recognition error, falling back to MediaRecorder:", err);
      }
    }

    // 2. Studio MediaRecorder + Gemini Neural Multilingual Acoustic Transcriber
    startMediaRecorder();
  };

  window.stopVoiceRecognition = function () {
    if (silenceCheckInterval) {
      clearInterval(silenceCheckInterval);
      silenceCheckInterval = null;
    }
    if (maxRecordTimeout) {
      clearTimeout(maxRecordTimeout);
      maxRecordTimeout = null;
    }
    if (isRecording) {
      stopMediaRecorder();
    }
    if (recognition && isListening) {
      try {
        recognition.stop();
      } catch (e) {}
    }
    isListening = false;
    isRecording = false;
  };

  window.toggleVoiceRecognition = function () {
    if (isListening || isRecording) {
      window.stopVoiceRecognition();
    } else {
      window.startVoiceRecognition();
    }
  };

  window.isListening = function () {
    return isListening || isRecording;
  };
})();
