// static/js/chat.js — VoxBridge Studio Interface & History Controller
(function () {
  /* ================= DOM REFERENCES ================= */
  const loadingScreen = document.getElementById("loading-screen");
  const homeView = document.getElementById("home-view");
  const chatView = document.getElementById("chat-view");

  const homeThemeToggle = document.getElementById("home-theme-toggle");
  const navStartChatBtn = document.getElementById("nav-start-chat-btn");
  const launchChatBtn = document.getElementById("launch-chat-btn");
  const backToHomeBtn = document.getElementById("back-to-home-btn");
  const headerHomeBtn = document.getElementById("header-home-btn");
  const homeUserNameInput = document.getElementById("home-user-name");

  const userDisplayChip = document.getElementById("user-display-chip");
  const currentUserNameSpan = document.getElementById("current-user-name");
  const heroGreetingName = document.getElementById("hero-greeting-name");
  const settingsUserNameInput = document.getElementById("settings-user-name");

  const chatSidebar = document.getElementById("chat-sidebar");
  const sidebarBackdrop = document.getElementById("sidebar-backdrop");
  const sidebarToggleBtn = document.getElementById("sidebar-toggle-btn");
  const newChatBtn = document.getElementById("new-chat-btn");
  const historySearch = document.getElementById("history-search");
  const historyList = document.getElementById("history-list");
  const exportAllBtn = document.getElementById("export-all-btn");
  const themeToggle = document.getElementById("theme-toggle");
  const themeText = document.getElementById("theme-text");
  const themeIcon = document.getElementById("theme-icon");

  const currentChatTitle = document.getElementById("current-chat-title");
  const detectedFlag = document.getElementById("detected-flag");
  const detectedLangLabel = document.getElementById("detected-lang-label");
  const speechCodeBadge = document.getElementById("speech-code-badge");
  const langPicker = document.getElementById("lang-picker");
  const exportChatBtn = document.getElementById("export-chat-btn");
  const clearBtn = document.getElementById("clear-btn");
  const settingsBtn = document.getElementById("settings-btn");
  const settingsTriggerBtn = document.getElementById("settings-trigger-btn");

  const visualizerContainer = document.getElementById("visualizer-container");
  const visualizerCanvas = document.getElementById("audio-visualizer-canvas");
  const visualizerLabel = document.getElementById("visualizer-label");

  const chatBox = document.getElementById("chat-box");
  const starterView = document.getElementById("starter-view");
  const voiceStatusBar = document.getElementById("voice-status-bar");
  const voiceStatusText = document.getElementById("voice-status-text");
  const stopSpeechAudioBtn = document.getElementById("stop-speech-audio-btn");

  const chatForm = document.getElementById("chat-form");
  const messageInput = document.getElementById("message-input");
  const micBtn = document.getElementById("mic-btn");
  const sendBtn = document.getElementById("send-btn");
  const charCount = document.getElementById("char-count");
  const handsFreeDot = document.getElementById("handsfree-dot");
  const handsFreeLabel = document.getElementById("handsfree-label");
  const quickHandsfreeToggle = document.getElementById("quick-handsfree-toggle");

  const settingsBackdrop = document.getElementById("settings-backdrop");
  const settingsPanel = document.getElementById("settings-panel");
  const settingsClose = document.getElementById("settings-close");
  const autospeakToggle = document.getElementById("autospeak-toggle");
  const handsfreeToggle = document.getElementById("handsfree-toggle");
  const speedSlider = document.getElementById("speed-slider");
  const speedDisplay = document.getElementById("speed-display");
  const showTranslationsToggle = document.getElementById("show-translations-toggle");
  const darkToggle = document.getElementById("dark-toggle");

  // Voice Gender Tone Selectors
  const headerGenderPicker = document.getElementById("header-gender-picker");
  const homeVoiceGenderPicker = document.getElementById("home-voice-gender-picker");
  const modalGenderFemale = document.getElementById("modal-gender-female");
  const modalGenderMale = document.getElementById("modal-gender-male");
  const genderBtnFemale = document.getElementById("gender-btn-female");
  const genderBtnMale = document.getElementById("gender-btn-male");
  const testVoiceBtn = document.getElementById("test-voice-btn");

  const clearModal = document.getElementById("clear-modal");
  const clearCancel = document.getElementById("clear-cancel");
  const clearConfirm = document.getElementById("clear-confirm");

  // Name Entry Modal
  const nameModal = document.getElementById("name-modal");
  const modalUserNameInput = document.getElementById("modal-user-name-input");
  const modalNameSubmitBtn = document.getElementById("modal-name-submit-btn");
  const nameErrorMsg = document.getElementById("name-error-msg");

  /* ================= STORAGE KEYS & APP STATE ================= */
  const CONVERSATIONS_STORAGE_KEY = "voxbridge_blue_conversations_v5";
  const SETTINGS_STORAGE_KEY = "voxbridge_blue_settings_v5";
  const ACTIVE_CONV_KEY = "voxbridge_blue_active_id";
  const CUSTOMER_NAME_KEY = "voxbridge_customer_name";

  let conversations = [];
  let activeConvId = null;
  let currentSpeakingButton = null;
  let customerName = localStorage.getItem(CUSTOMER_NAME_KEY) || "Customer";

  /* ================= CUSTOMER NAME MANAGEMENT ================= */
  function updateCustomerName(newName) {
    if (newName && newName.trim()) {
      customerName = newName.trim();
    } else {
      customerName = "Customer";
    }
    localStorage.setItem(CUSTOMER_NAME_KEY, customerName);

    if (currentUserNameSpan) currentUserNameSpan.textContent = customerName;
    if (heroGreetingName) heroGreetingName.textContent = customerName;
    if (homeUserNameInput) homeUserNameInput.value = customerName === "Customer" ? "" : customerName;
    if (settingsUserNameInput) settingsUserNameInput.value = customerName === "Customer" ? "" : customerName;

    // Update active conversation's customer name
    const conv = getActiveConversation();
    if (conv) {
      conv.customerName = customerName;
      saveConversations();
    }
  }

  function openNameModal() {
    if (modalUserNameInput) {
      modalUserNameInput.value = (customerName && customerName !== "Customer") ? customerName : "";
    }
    if (nameErrorMsg) nameErrorMsg.classList.add("hidden");
    if (nameModal) {
      nameModal.classList.add("open");
      nameModal.setAttribute("aria-hidden", "false");
    }
    setTimeout(() => {
      if (modalUserNameInput) modalUserNameInput.focus();
    }, 150);
  }

  function closeNameModal() {
    if (nameModal) {
      nameModal.classList.remove("open");
      nameModal.setAttribute("aria-hidden", "true");
    }
  }

  function handleNameModalSubmit() {
    const val = modalUserNameInput ? modalUserNameInput.value.trim() : "";
    if (!val) {
      if (nameErrorMsg) nameErrorMsg.classList.remove("hidden");
      if (modalUserNameInput) modalUserNameInput.focus();
      return;
    }

    // Read selected voice gender from modal
    const activeGenderBtn = document.querySelector("#name-modal .gender-segment-btn.active");
    const chosenGender = activeGenderBtn ? activeGenderBtn.dataset.gender : "female";
    if (window.setVoiceGender) {
      window.setVoiceGender(chosenGender);
      handleGenderChange(chosenGender);
    }

    updateCustomerName(val);
    closeNameModal();
    showChatViewDirect();
  }

  if (modalNameSubmitBtn) {
    modalNameSubmitBtn.addEventListener("click", handleNameModalSubmit);
  }
  if (modalUserNameInput) {
    modalUserNameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleNameModalSubmit();
      }
    });
    modalUserNameInput.addEventListener("input", () => {
      if (modalUserNameInput.value.trim() && nameErrorMsg) {
        nameErrorMsg.classList.add("hidden");
      }
    });
  }
  if (nameModal) {
    nameModal.addEventListener("click", (e) => {
      if (e.target === nameModal) {
        // Only allow closing if name is already set
        if (customerName && customerName !== "Customer") {
          closeNameModal();
        }
      }
    });
  }

  function promptChangeName() {
    openNameModal();
  }

  if (userDisplayChip) userDisplayChip.addEventListener("click", promptChangeName);
  if (settingsUserNameInput) {
    settingsUserNameInput.addEventListener("change", () => {
      updateCustomerName(settingsUserNameInput.value);
    });
  }

  /* ================= VIEW NAVIGATION (HOME <-> CHAT) ================= */
  function showHomeView() {
    chatView.classList.remove("active");
    homeView.classList.add("active");
  }

  function showChatView() {
    const fromInput = homeUserNameInput ? homeUserNameInput.value.trim() : "";
    const savedName = (customerName && customerName !== "Customer") ? customerName : "";
    const activeName = fromInput || savedName;

    if (!activeName) {
      // User cannot enter without entering their name!
      const heroCard = document.getElementById("hero-name-card");
      const homeNameError = document.getElementById("home-name-error");
      if (heroCard) {
        heroCard.classList.remove("shake");
        void heroCard.offsetWidth; // Force reflow
        heroCard.classList.add("shake");
      }
      if (homeNameError) {
        homeNameError.classList.remove("hidden");
      }
      if (homeUserNameInput) {
        homeUserNameInput.focus();
      }
      showToast("⚠️ Name required to enter VoxBridge!");
      return;
    }

    updateCustomerName(activeName);

    // Sync selected voice gender tone
    if (homeVoiceGenderPicker && window.setVoiceGender) {
      window.setVoiceGender(homeVoiceGenderPicker.value);
      handleGenderChange(homeVoiceGenderPicker.value);
    }

    showChatViewDirect();
  }

  function showChatViewDirect() {
    homeView.classList.remove("active");
    chatView.classList.add("active");

    // Always ensure entering the chat opens a fresh, clean New Chat interface
    const active = getActiveConversation();
    if (!active || (active.messages && active.messages.length > 0)) {
      createNewConversation(true);
    } else {
      renderActiveConversation();
    }

    setTimeout(() => {
      messageInput.focus();
    }, 200);
  }

  if (launchChatBtn) launchChatBtn.addEventListener("click", showChatView);
  if (navStartChatBtn) {
    navStartChatBtn.addEventListener("click", () => {
      const fromInput = homeUserNameInput ? homeUserNameInput.value.trim() : "";
      const savedName = (customerName && customerName !== "Customer") ? customerName : "";
      const activeName = fromInput || savedName;
      if (!activeName) {
        openNameModal();
      } else {
        showChatView();
      }
    });
  }
  if (homeUserNameInput) {
    homeUserNameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        showChatView();
      }
    });
    homeUserNameInput.addEventListener("input", () => {
      const homeNameError = document.getElementById("home-name-error");
      if (homeUserNameInput.value.trim() && homeNameError) {
        homeNameError.classList.add("hidden");
      }
    });
  }
  if (backToHomeBtn) backToHomeBtn.addEventListener("click", showHomeView);
  if (headerHomeBtn) headerHomeBtn.addEventListener("click", showHomeView);

  /* ================= AUDIO CANVAS OSCILLOSCOPE ================= */
  let visualizerMode = "idle"; // "idle" | "listening" | "speaking"
  let canvasCtx = null;
  let animFrameId = null;

  if (visualizerCanvas) {
    canvasCtx = visualizerCanvas.getContext("2d");
  }

  function startVisualizer() {
    if (!canvasCtx) return;
    let phase = 0;

    function render() {
      const width = visualizerCanvas.width;
      const height = visualizerCanvas.height;
      canvasCtx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      const blueColor = isDark ? "#3b82f6" : "#2563eb";
      const cyanColor = "#06b6d4";

      if (visualizerMode === "idle") {
        canvasCtx.beginPath();
        canvasCtx.lineWidth = 1.5;
        canvasCtx.strokeStyle = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";
        for (let x = 0; x < width; x++) {
          const y = height / 2 + Math.sin(x * 0.05 + phase) * 2;
          if (x === 0) canvasCtx.moveTo(x, y);
          else canvasCtx.lineTo(x, y);
        }
        canvasCtx.stroke();
        phase += 0.03;
      } else if (visualizerMode === "listening") {
        canvasCtx.beginPath();
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = "#f43f5e";
        for (let x = 0; x < width; x++) {
          const envelope = Math.sin((x / width) * Math.PI);
          const y =
            height / 2 +
            Math.sin(x * 0.18 + phase) * 7 * envelope +
            Math.sin(x * 0.35 + phase * 1.5) * 4 * envelope;
          if (x === 0) canvasCtx.moveTo(x, y);
          else canvasCtx.lineTo(x, y);
        }
        canvasCtx.stroke();
        phase += 0.22;
      } else if (visualizerMode === "speaking") {
        canvasCtx.beginPath();
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = cyanColor;
        for (let x = 0; x < width; x++) {
          const envelope = Math.sin((x / width) * Math.PI);
          const y =
            height / 2 +
            Math.sin(x * 0.09 + phase) * 6 * envelope +
            Math.cos(x * 0.18 + phase * 0.8) * 4 * envelope;
          if (x === 0) canvasCtx.moveTo(x, y);
          else canvasCtx.lineTo(x, y);
        }
        canvasCtx.stroke();
        phase += 0.14;
      }

      animFrameId = requestAnimationFrame(render);
    }

    render();
  }

  function setVisualizerState(mode, labelText) {
    visualizerMode = mode;
    if (visualizerLabel) {
      visualizerLabel.textContent = labelText || (mode === "idle" ? "VOICE READY" : mode.toUpperCase());
    }
    if (visualizerContainer) {
      if (mode !== "idle") {
        visualizerContainer.classList.add("active");
      } else {
        visualizerContainer.classList.remove("active");
      }
    }
  }

  /* ================= SETTINGS MANAGER ================= */
  function loadSettings() {
    try {
      return (
        JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY)) || {
          dark: true,
          autoSpeak: true,
          handsFree: false,
          speed: 1.0,
          showTranslations: true,
        }
      );
    } catch (e) {
      return { dark: true, autoSpeak: true, handsFree: false, speed: 1.0, showTranslations: true };
    }
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {}
  }

  function applySettings(settings) {
    const isDark = settings.dark !== false;
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    if (darkToggle) darkToggle.checked = isDark;
    if (themeText) themeText.textContent = isDark ? "Light" : "Dark";
    if (themeIcon) themeIcon.textContent = isDark ? "☀️" : "🌙";

    if (autospeakToggle) autospeakToggle.checked = settings.autoSpeak !== false;
    if (handsfreeToggle) handsfreeToggle.checked = !!settings.handsFree;
    if (speedSlider) {
      speedSlider.value = settings.speed || 1.0;
      if (speedDisplay) speedDisplay.textContent = parseFloat(speedSlider.value).toFixed(1) + "x";
    }
    if (showTranslationsToggle) showTranslationsToggle.checked = settings.showTranslations !== false;

    window.autoSpeak = autospeakToggle ? autospeakToggle.checked : true;
    window.handsFree = handsfreeToggle ? handsfreeToggle.checked : false;
    window.speechRate = speedSlider ? parseFloat(speedSlider.value) : 1.0;
    window.showTranslations = showTranslationsToggle ? showTranslationsToggle.checked : true;

    const savedGender = settings.voiceGender || localStorage.getItem("voxbridge_voice_gender") || "female";
    if (window.setVoiceGender) {
      window.setVoiceGender(savedGender);
    } else {
      window.voiceGender = savedGender;
    }
    updateGenderButtonUI(savedGender);
    updateHandsfreeUI();
  }

  function updateGenderButtonUI(gender) {
    const isMale = gender === "male";
    if (genderBtnFemale && genderBtnMale) {
      if (isMale) {
        genderBtnMale.classList.add("active");
        genderBtnFemale.classList.remove("active");
      } else {
        genderBtnFemale.classList.add("active");
        genderBtnMale.classList.remove("active");
      }
    }
    if (modalGenderFemale && modalGenderMale) {
      if (isMale) {
        modalGenderMale.classList.add("active");
        modalGenderFemale.classList.remove("active");
      } else {
        modalGenderFemale.classList.add("active");
        modalGenderMale.classList.remove("active");
      }
    }
    const starterFemale = document.getElementById("starter-gender-female");
    const starterMale = document.getElementById("starter-gender-male");
    if (starterFemale && starterMale) {
      if (isMale) {
        starterMale.classList.add("active");
        starterFemale.classList.remove("active");
      } else {
        starterFemale.classList.add("active");
        starterMale.classList.remove("active");
      }
    }
    if (headerGenderPicker) headerGenderPicker.value = isMale ? "male" : "female";
  }

  function handleGenderChange(gender, showToastMessage = true) {
    const valid = gender === "male" ? "male" : "female";
    if (window.setVoiceGender) {
      window.setVoiceGender(valid);
    } else {
      window.voiceGender = valid;
    }
    updateGenderButtonUI(valid);
    persistCurrentSettings();
    if (showToastMessage) {
      showToast(`AI voice set to ${valid === "male" ? "👨 Male Voice" : "👩 Female Voice"}`);
    }
  }

  function updateHandsfreeUI() {
    if (handsFreeDot && handsFreeLabel) {
      if (window.handsFree) {
        handsFreeDot.classList.add("active");
        handsFreeLabel.textContent = "Hands-Free: Active";
      } else {
        handsFreeDot.classList.remove("active");
        handsFreeLabel.textContent = "Hands-Free: Standby";
      }
    }
  }

  function persistCurrentSettings() {
    const current = {
      dark: darkToggle ? darkToggle.checked : true,
      autoSpeak: autospeakToggle ? autospeakToggle.checked : true,
      handsFree: handsfreeToggle ? handsfreeToggle.checked : false,
      speed: speedSlider ? parseFloat(speedSlider.value) : 1.0,
      showTranslations: showTranslationsToggle ? showTranslationsToggle.checked : true,
      voiceGender: window.voiceGender || "female",
    };
    saveSettings(current);
    applySettings(current);
  }

  /* ================= TOAST NOTIFICATION ================= */
  function showToast(message) {
    let toast = document.querySelector(".studio-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "studio-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("visible");
    setTimeout(() => {
      toast.classList.remove("visible");
    }, 2400);
  }
  window.showToast = showToast;

  /* ================= CONVERSATION STORE ================= */
  function loadConversations() {
    try {
      const data = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
      if (data) {
        conversations = JSON.parse(data);
      }
    } catch (e) {
      conversations = [];
    }

    if (!Array.isArray(conversations) || conversations.length === 0) {
      createNewConversation(false);
    } else {
      const savedActive = localStorage.getItem(ACTIVE_CONV_KEY);
      const exists = conversations.find((c) => c.id === savedActive);
      activeConvId = exists ? exists.id : conversations[0].id;
    }
  }

  function saveConversations() {
    try {
      localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
      if (activeConvId) {
        localStorage.setItem(ACTIVE_CONV_KEY, activeConvId);
      }
    } catch (e) {}
  }

  function getActiveConversation() {
    return conversations.find((c) => c.id === activeConvId);
  }

  function createNewConversation(shouldSave = true) {
    const newId = "session_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
    const newConv = {
      id: newId,
      customerName: customerName,
      title: "Multilingual Support Session",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      primaryLanguage: "Auto-detect",
      flag: "🌐",
      intent: "Inquiry",
      sentiment: "Neutral",
      messages: [],
    };

    conversations.unshift(newConv);
    activeConvId = newId;

    if (shouldSave) {
      saveConversations();
    }

    renderSidebarHistory();
    renderActiveConversation();

    if (window.innerWidth <= 768) {
      closeSidebar();
    }
    messageInput.focus();
  }

  function selectConversation(id) {
    activeConvId = id;
    saveConversations();
    renderSidebarHistory();
    renderActiveConversation();

    if (window.innerWidth <= 768) {
      closeSidebar();
    }
    messageInput.focus();
  }

  let pendingDeleteConvId = null;
  const deleteSessionModal = document.getElementById("delete-session-modal");
  const deleteSessionCancel = document.getElementById("delete-session-cancel");
  const deleteSessionConfirm = document.getElementById("delete-session-confirm");
  const deleteSessionName = document.getElementById("delete-session-name");

  function openDeleteModal(id) {
    pendingDeleteConvId = id;
    const conv = conversations.find((c) => c.id === id);
    if (deleteSessionName) {
      deleteSessionName.textContent = conv ? conv.title : "this session";
    }
    if (deleteSessionModal) {
      deleteSessionModal.classList.add("open");
      deleteSessionModal.setAttribute("aria-hidden", "false");
    }
  }

  function closeDeleteModal() {
    pendingDeleteConvId = null;
    if (deleteSessionModal) {
      deleteSessionModal.classList.remove("open");
      deleteSessionModal.setAttribute("aria-hidden", "true");
    }
  }

  function deleteConversation(id, e) {
    if (e) e.stopPropagation();
    openDeleteModal(id);
  }

  function executeDeleteConversation() {
    if (!pendingDeleteConvId) return;
    const id = pendingDeleteConvId;

    if (conversations.length <= 1) {
      const conv = conversations[0];
      conv.messages = [];
      conv.title = "Multilingual Support Session";
      conv.primaryLanguage = "Auto-detect";
      conv.flag = "🌐";
      conv.intent = "Inquiry";
      saveConversations();
      renderSidebarHistory();
      renderActiveConversation();
      showToast("Session cleared & reset");
      closeDeleteModal();
      return;
    }

    conversations = conversations.filter((c) => c.id !== id);
    if (activeConvId === id) {
      activeConvId = conversations[0].id;
    }

    saveConversations();
    renderSidebarHistory();
    renderActiveConversation();
    showToast("Chat session deleted");
    closeDeleteModal();
  }

  if (deleteSessionCancel) deleteSessionCancel.addEventListener("click", closeDeleteModal);
  if (deleteSessionConfirm) deleteSessionConfirm.addEventListener("click", executeDeleteConversation);
  if (deleteSessionModal) {
    deleteSessionModal.addEventListener("click", (e) => {
      if (e.target === deleteSessionModal) closeDeleteModal();
    });
  }

  function renameConversation(id, e) {
    if (e) e.stopPropagation();
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;

    const newTitle = prompt("Rename conversation session:", conv.title);
    if (newTitle && newTitle.trim()) {
      conv.title = newTitle.trim();
      saveConversations();
      renderSidebarHistory();
      if (activeConvId === id) {
        currentChatTitle.textContent = conv.title;
      }
    }
  }

  /* ================= SIDEBAR RENDERING ================= */
  function renderSidebarHistory(searchQuery = "") {
    historyList.innerHTML = "";

    const query = searchQuery.trim().toLowerCase();
    const filtered = conversations.filter((c) => {
      if (!query) return true;
      return (
        c.title.toLowerCase().includes(query) ||
        (c.customerName && c.customerName.toLowerCase().includes(query)) ||
        (c.primaryLanguage && c.primaryLanguage.toLowerCase().includes(query)) ||
        c.messages.some((m) => m.text.toLowerCase().includes(query))
      );
    });

    if (filtered.length === 0) {
      const empty = document.createElement("div");
      empty.className = "sidebar-category-label";
      empty.textContent = "No matching sessions";
      historyList.appendChild(empty);
      return;
    }

    filtered.forEach((conv) => {
      const item = document.createElement("div");
      item.className = "history-item" + (conv.id === activeConvId ? " active" : "");
      item.onclick = () => selectConversation(conv.id);

      const content = document.createElement("div");
      content.className = "history-item-content";

      const title = document.createElement("div");
      title.className = "history-item-title";
      title.textContent = conv.title;

      const meta = document.createElement("div");
      meta.className = "history-item-meta";
      const count = conv.messages.length;
      meta.textContent = `${conv.flag || "🌐"} ${conv.primaryLanguage || "Auto-detect"} · ${count} msg${count === 1 ? "" : "s"}`;

      content.appendChild(title);
      content.appendChild(meta);

      const actions = document.createElement("div");
      actions.className = "history-item-actions";

      const editBtn = document.createElement("button");
      editBtn.className = "history-action-btn";
      editBtn.innerHTML = "✎";
      editBtn.title = "Rename";
      editBtn.onclick = (e) => renameConversation(conv.id, e);

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "history-action-btn";
      deleteBtn.innerHTML = "✕";
      deleteBtn.title = "Delete";
      deleteBtn.onclick = (e) => deleteConversation(conv.id, e);

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      item.appendChild(content);
      item.appendChild(actions);
      historyList.appendChild(item);
    });
  }

  /* ================= CHAT WORKSPACE RENDERING ================= */
  function renderActiveConversation() {
    const conv = getActiveConversation();
    if (!conv) return;

    currentChatTitle.textContent = conv.title;
    detectedFlag.textContent = conv.flag || "🌐";
    detectedLangLabel.textContent = conv.primaryLanguage ? `Language: ${conv.primaryLanguage}` : "Auto-detecting";

    if (conv.customerName) {
      customerName = conv.customerName;
      if (currentUserNameSpan) currentUserNameSpan.textContent = customerName;
      if (heroGreetingName) heroGreetingName.textContent = customerName;
    }

    // Clear message feed (preserve starter-view)
    const existingRows = chatBox.querySelectorAll(".message-row");
    existingRows.forEach((r) => r.remove());

    if (conv.messages.length === 0) {
      starterView.style.display = "flex";
      speechCodeBadge.textContent = "MULTI";
    } else {
      starterView.style.display = "none";
      const lastBotMsg = [...conv.messages].reverse().find((m) => m.who === "bot");
      if (lastBotMsg && lastBotMsg.lang_code) {
        speechCodeBadge.textContent = lastBotMsg.lang_code.toUpperCase();
      } else {
        speechCodeBadge.textContent = "MULTI";
      }

      conv.messages.forEach((msg) => {
        appendMessageElement(msg);
      });
    }

    scrollToBottom();
  }

  function appendMessageElement(msg) {
    const row = document.createElement("div");
    row.className = `message-row ${msg.who}`;
    row.id = "msg-" + msg.id;

    const card = document.createElement("div");
    card.className = "message-card";

    // Metadata header
    if (msg.who === "bot") {
      const metaHeader = document.createElement("div");
      metaHeader.className = "message-meta-header";

      const origin = document.createElement("span");
      origin.className = "meta-origin";
      origin.textContent = `${msg.flag || "🌐"} ${msg.language || "VoxBridge Support"}`;

      const time = document.createElement("span");
      time.className = "meta-timestamp";
      time.textContent = msg.timestamp || "";

      metaHeader.appendChild(origin);
      metaHeader.appendChild(document.createTextNode(" · "));
      metaHeader.appendChild(time);

      if (msg.latencyMs) {
        const latencyBadge = document.createElement("span");
        latencyBadge.className = `latency-badge ${msg.cached ? "cached-badge" : ""}`;
        latencyBadge.textContent = msg.cached ? `⚡ ${msg.latencyMs}ms (Instant)` : `⚡ ${msg.latencyMs}ms`;
        metaHeader.appendChild(latencyBadge);
      }

      card.appendChild(metaHeader);
    } else {
      const metaHeader = document.createElement("div");
      metaHeader.className = "message-meta-header";

      const origin = document.createElement("span");
      origin.className = "meta-origin";
      origin.textContent = `👤 ${customerName || "Customer"}`;

      const time = document.createElement("span");
      time.className = "meta-timestamp";
      time.textContent = msg.timestamp || "";

      metaHeader.appendChild(origin);
      metaHeader.appendChild(document.createTextNode(" · "));
      metaHeader.appendChild(time);
      card.appendChild(metaHeader);
    }

    // Message body text
    const textP = document.createElement("p");
    textP.className = "message-text";
    textP.textContent = msg.text;
    card.appendChild(textP);

    // Automatic English Translation Box for non-English Bot Responses
    if (
      msg.who === "bot" &&
      msg.translation &&
      msg.translation.trim() &&
      msg.translation !== msg.text &&
      msg.detected_language !== "en" &&
      window.showTranslations !== false
    ) {
      const autoTransBox = document.createElement("div");
      autoTransBox.className = "custom-translation-box default-trans-box";
      autoTransBox.innerHTML = `
        <div class="translation-header-row">
          <span class="trans-tag">🇺🇸 English Translation</span>
          <div class="trans-controls">
            <button type="button" class="studio-deck-btn auto-listen-btn">▶ Listen</button>
            <button type="button" class="studio-deck-btn auto-copy-btn">Copy</button>
          </div>
        </div>
        <div class="trans-body">${escapeHtml(msg.translation)}</div>
      `;

      const autoListen = autoTransBox.querySelector(".auto-listen-btn");
      if (autoListen) {
        autoListen.onclick = () => {
          handleVoicePlay(autoListen, msg.translation, "en-US");
        };
      }

      const autoCopy = autoTransBox.querySelector(".auto-copy-btn");
      if (autoCopy) {
        autoCopy.onclick = () => {
          navigator.clipboard.writeText(msg.translation).then(() => {
            autoCopy.textContent = "✓ Copied";
            showToast("English translation copied");
            setTimeout(() => (autoCopy.textContent = "Copy"), 1800);
          });
        };
      }

      card.appendChild(autoTransBox);
    }

    // Message actions bar: Listen, Copy, Translate to ANY language for both bot and user messages
    const audioDeck = document.createElement("div");
    audioDeck.className = "audio-deck-bar";

    // 1. Listen / Audio button
    const playBtn = document.createElement("button");
    playBtn.type = "button";
    playBtn.className = "studio-play-btn";
    playBtn.innerHTML = `<span>▶ Listen</span>`;
    playBtn.onclick = () => handleVoicePlay(playBtn, msg.text, msg.lang_code || "en-US");
    audioDeck.appendChild(playBtn);

    // 2. Copy button
    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "studio-deck-btn";
    copyBtn.textContent = "Copy";
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(msg.text).then(() => {
        copyBtn.textContent = "✓ Copied";
        showToast("Copied message to clipboard");
        setTimeout(() => (copyBtn.textContent = "Copy"), 1800);
      });
    };
    audioDeck.appendChild(copyBtn);

    // 2.5 Speed toggle pill
    const speedPill = document.createElement("button");
    speedPill.type = "button";
    speedPill.className = "studio-deck-btn";
    speedPill.textContent = (window.speechRate || 1.0) + "x";
    speedPill.title = "Audio Playback Speed";
    speedPill.onclick = () => {
      const cur = window.speechRate || 1.0;
      let nextRate = 1.0;
      if (cur === 1.0) nextRate = 1.25;
      else if (cur === 1.25) nextRate = 1.5;
      else nextRate = 1.0;
      window.speechRate = nextRate;
      speedPill.textContent = nextRate + "x";
      if (speedSlider) speedSlider.value = nextRate;
      if (speedDisplay) speedDisplay.textContent = nextRate + "x";
      showToast(`Audio speed set to ${nextRate}x`);
    };
    audioDeck.appendChild(speedPill);

    // 3. Translate to ANY universal language dropdown
    const translateWrapper = document.createElement("div");
    translateWrapper.className = "translate-picker-group";

    const translateSelect = document.createElement("select");
    translateSelect.className = "translate-quick-select";
    translateSelect.setAttribute("aria-label", "Translate message to any universal language");
    translateSelect.innerHTML = `
      <option value="">🌐 Translate to…</option>
      <option value="en">🇺🇸 English</option>
      <option value="ar">🇸🇦 Arabic (العربية)</option>
      <option value="es">🇪🇸 Spanish (Español)</option>
      <option value="fr">🇫🇷 French (Français)</option>
      <option value="de">🇩🇪 German (Deutsch)</option>
      <option value="zh">🇨🇳 Chinese (中文)</option>
      <option value="ja">🇯🇵 Japanese (日本語)</option>
      <option value="ko">🇰🇷 Korean (한국어)</option>
      <option value="hi">🇮🇳 Hindi (हिन्दी)</option>
      <option value="pt">🇧🇷 Portuguese (Português)</option>
      <option value="ru">🇷🇺 Russian (Русский)</option>
      <option value="it">🇮🇹 Italian (Italiano)</option>
      <option value="tr">🇹🇷 Turkish (Türkçe)</option>
      <option value="nl">🇳🇱 Dutch (Nederlands)</option>
      <option value="ta">🇮🇳 Tamil (தமிழ்)</option>
      <option value="te">🇮🇳 Telugu (తెలుగు)</option>
      <option value="ml">🇮🇳 Malayalam (മലയാളം)</option>
      <option value="kn">🇮🇳 Kannada (ಕನ್ನಡ)</option>
      <option value="bn">🇧🇩 Bengali (বাংলা)</option>
    `;

    translateSelect.onchange = async () => {
      const targetLang = translateSelect.value;
      if (!targetLang) return;

      let existingBox = card.querySelector(".custom-translation-box");
      if (existingBox) existingBox.remove();

      const loadingBox = document.createElement("div");
      loadingBox.className = "custom-translation-box";
      loadingBox.innerHTML = `<span>Translating message…</span>`;
      card.appendChild(loadingBox);

      try {
        const res = await fetch("/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: msg.text, targetLang }),
        });
        const data = await res.json();
        loadingBox.remove();

        if (data.translatedText) {
          const transBox = document.createElement("div");
          transBox.className = "custom-translation-box";

          const langName = translateSelect.options[translateSelect.selectedIndex].text;
          transBox.innerHTML = `
            <div class="translation-header-row">
              <span class="trans-tag">Translated to ${langName}</span>
              <div class="trans-controls">
                <button type="button" class="studio-deck-btn trans-listen-btn">▶ Listen</button>
                <button type="button" class="studio-deck-btn trans-copy-btn">Copy</button>
                <button type="button" class="studio-deck-btn trans-close-btn" title="Close translation">✕</button>
              </div>
            </div>
            <div class="trans-body">${escapeHtml(data.translatedText)}</div>
          `;

          // Listen button on translation
          const transListenBtn = transBox.querySelector(".trans-listen-btn");
          transListenBtn.onclick = () => {
            handleVoicePlay(transListenBtn, data.translatedText, data.lang_code || targetLang);
          };

          // Copy button on translation
          const transCopyBtn = transBox.querySelector(".trans-copy-btn");
          transCopyBtn.onclick = () => {
            navigator.clipboard.writeText(data.translatedText).then(() => {
              transCopyBtn.textContent = "✓ Copied";
              setTimeout(() => (transCopyBtn.textContent = "Copy"), 1800);
            });
          };

          // Close button on translation
          const transCloseBtn = transBox.querySelector(".trans-close-btn");
          transCloseBtn.onclick = () => {
            transBox.remove();
            translateSelect.value = "";
          };

          card.appendChild(transBox);
        }
      } catch (err) {
        console.error("Translation failed:", err);
        loadingBox.innerHTML = `<span>Translation failed. Try again.</span>`;
      }
    };

    translateWrapper.appendChild(translateSelect);
    audioDeck.appendChild(translateWrapper);

    // 4. Enterprise CSAT Feedback Rating (Helpful / Not Helpful)
    if (msg.who === "bot") {
      const csatGroup = document.createElement("div");
      csatGroup.className = "csat-feedback-group";

      const thumbsUp = document.createElement("button");
      thumbsUp.type = "button";
      thumbsUp.className = "csat-btn";
      thumbsUp.innerHTML = "👍 Helpful";
      thumbsUp.onclick = () => {
        csatGroup.innerHTML = '<span style="color:#10b981; font-size:11px; font-weight:600;">✓ Thanks for feedback!</span>';
        showToast("Feedback recorded: Helpful (+1)");
      };

      const thumbsDown = document.createElement("button");
      thumbsDown.type = "button";
      thumbsDown.className = "csat-btn";
      thumbsDown.innerHTML = "👎";
      thumbsDown.onclick = () => {
        csatGroup.innerHTML = '<span style="color:var(--text-muted); font-size:11px;">✓ Feedback noted</span>';
        showToast("Feedback recorded");
      };

      csatGroup.appendChild(thumbsUp);
      csatGroup.appendChild(thumbsDown);
      audioDeck.appendChild(csatGroup);
    }

    card.appendChild(audioDeck);

    row.appendChild(card);

    // Contextual Suggestion Pills
    if (msg.who === "bot" && Array.isArray(msg.suggestions) && msg.suggestions.length > 0) {
      const flow = document.createElement("div");
      flow.className = "suggestions-flow";
      msg.suggestions.forEach((sug) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "suggestion-capsule";
        chip.textContent = sug;
        chip.onclick = () => sendQuery(sug, msg.detected_language || conv.activeLang);
        flow.appendChild(chip);
      });
      row.appendChild(flow);
    }

    chatBox.appendChild(row);
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function addTypingBubble() {
    starterView.style.display = "none";
    const row = document.createElement("div");
    row.className = "message-row bot typing-row";

    const card = document.createElement("div");
    card.className = "message-card";
    card.innerHTML = `
      <div class="typing-wave-dots">
        <span></span><span></span><span></span>
      </div>
    `;

    row.appendChild(card);
    chatBox.appendChild(row);
    scrollToBottom();
    return row;
  }

  function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function formatTime(date = new Date()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  /* ================= AUDIO PLAYBACK HANDLING ================= */
  function handleVoicePlay(button, text, langCode) {
    if (button.classList.contains("speaking")) {
      window.stopSpeaking();
      resetAudioButton(button);
      setVisualizerState("idle", "VOICE READY");
      return;
    }

    if (currentSpeakingButton) {
      resetAudioButton(currentSpeakingButton);
    }

    currentSpeakingButton = button;
    button.classList.add("speaking");
    button.innerHTML = `
      <div class="mini-wave-bars"><span></span><span></span><span></span><span></span></div>
      <span>Speaking…</span>
    `;

    setVoiceStatusBar(true, `Vocalizing in ${langCode || "native accent"}…`);
    setVisualizerState("speaking", "AUDIO OUTPUT ACTIVE");

    window.speak(text, langCode, () => {
      resetAudioButton(button);
      setVoiceStatusBar(false);
      setVisualizerState("idle", "VOICE READY");
    });
  }

  function resetAudioButton(button) {
    if (!button) return;
    button.classList.remove("speaking");
    button.innerHTML = `<span>▶ Listen</span>`;
    if (currentSpeakingButton === button) {
      currentSpeakingButton = null;
    }
  }

  function setVoiceStatusBar(visible, label = "") {
    if (visible) {
      voiceStatusText.textContent = label;
      voiceStatusBar.classList.remove("hidden");
    } else {
      voiceStatusBar.classList.add("hidden");
    }
  }

  /* ================= SENDING MESSAGES ================= */
  async function sendQuery(rawText, explicitContextLang) {
    const text = (rawText || messageInput.value || "").trim();
    if (!text || sendBtn.disabled) return;

    messageInput.value = "";
    charCount.textContent = "0 / 1000";
    messageInput.style.height = "auto";
    sendBtn.disabled = true;

    const conv = getActiveConversation();
    if (!conv) return;

    const userMsg = {
      id: "u_" + Date.now(),
      who: "user",
      text,
      timestamp: formatTime(),
    };
    conv.messages.push(userMsg);
    conv.updatedAt = Date.now();

    if (conv.messages.length === 1) {
      conv.title = text.length > 34 ? text.substring(0, 34) + "…" : text;
      currentChatTitle.textContent = conv.title;
    }

    saveConversations();
    starterView.style.display = "none";
    appendMessageElement(userMsg);
    scrollToBottom();

    const typingBubble = addTypingBubble();

    try {
      const preferredLang = (langPicker && langPicker.value) ? langPicker.value : "";
      // "Any Language In. Same Language Out": Never force an old context language onto a new message!
      const res = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, name: customerName, lang: preferredLang }),
      });

      if (!res.ok) {
        throw new Error("Server error " + res.status);
      }

      const data = await res.json();
      typingBubble.remove();

      if (data.detected_language) {
        conv.activeLang = data.detected_language;
      }

      const botMsg = {
        id: "b_" + Date.now(),
        who: "bot",
        text: data.reply,
        translation: data.translation,
        language: data.language,
        lang_code: data.lang_code,
        detected_language: data.detected_language,
        intent: data.intent || "Customer Support",
        sentiment: data.sentiment || "Neutral",
        suggestions: data.suggestions || [],
        latencyMs: data.latencyMs,
        cached: data.cached,
        timestamp: formatTime(),
      };

      conv.messages.push(botMsg);
      conv.primaryLanguage = data.language;
      conv.flag = getFlagForLang(data.detected_language);
      conv.intent = data.intent || conv.intent;
      conv.sentiment = data.sentiment || conv.sentiment;
      conv.updatedAt = Date.now();

      detectedFlag.textContent = conv.flag;
      detectedLangLabel.textContent = `${data.language} (${data.detected_language.toUpperCase()})`;
      speechCodeBadge.textContent = data.lang_code.toUpperCase();

      saveConversations();
      renderSidebarHistory();
      appendMessageElement(botMsg);
      scrollToBottom();

      if (window.autoSpeak) {
        window.speak(data.reply, data.lang_code);
      }
    } catch (err) {
      console.error("Chat error:", err);
      typingBubble.remove();

      const errMsg = {
        id: "err_" + Date.now(),
        who: "bot",
        text: "Could not connect to the VoxBridge service. Please check connection and try again.",
        timestamp: formatTime(),
      };
      conv.messages.push(errMsg);
      saveConversations();
      appendMessageElement(errMsg);
      scrollToBottom();
    } finally {
      sendBtn.disabled = false;
      messageInput.focus();
    }
  }

  function getFlagForLang(shortCode) {
    const flags = {
      ta: "🇮🇳",
      hi: "🇮🇳",
      te: "🇮🇳",
      kn: "🇮🇳",
      ml: "🇮🇳",
      bn: "🇧🇩",
      fr: "🇫🇷",
      es: "🇪🇸",
      de: "🇩🇪",
      en: "🇺🇸",
      ja: "🇯🇵",
      zh: "🇨🇳",
      ar: "🇸🇦",
      pt: "🇧🇷",
      it: "🇮🇹",
      ru: "🇷🇺",
      nl: "🇳🇱",
      tr: "🇹🇷",
      vi: "🇻🇳",
      th: "🇹🇭",
    };
    return flags[shortCode] || "🌐";
  }

  /* ================= VOICE & EVENTS INTEGRATION ================= */
  window.addEventListener("vox-listen-start", () => {
    micBtn.classList.add("listening");
    micBtn.querySelector(".mic-btn-text").textContent = "Stop";
    setVoiceStatusBar(true, `Listening in ${window.voiceLang || "your native accent"}…`);
    setVisualizerState("listening", "MIC AUDIO STREAMING");
    messageInput.placeholder = "Listening now… speak naturally in your language";
  });

  window.addEventListener("vox-listen-result", (e) => {
    const { interim, final, live } = e.detail;
    const textToShow = live || final || interim || "";
    if (textToShow) {
      messageInput.value = textToShow;
      charCount.textContent = `${textToShow.length} / 1000`;
    }
  });

  window.addEventListener("vox-listen-end", () => {
    micBtn.classList.remove("listening");
    micBtn.querySelector(".mic-btn-text").textContent = "Voice";
    if (!window.isSpeaking()) {
      setVoiceStatusBar(false);
      setVisualizerState("idle", "VOICE READY");
    }
    messageInput.placeholder =
      "Speak or type in any language (Press Enter to send)…";

    // When listening stops, automatically send the recognized message
    const spokenText = messageInput.value.trim();
    if (spokenText) {
      sendQuery(spokenText);
    }
  });

  const micPermissionModal = document.getElementById("mic-permission-modal");
  const micModalCloseBtn = document.getElementById("mic-modal-close-btn");
  const micLaunchStandaloneBtn = document.getElementById("mic-launch-standalone-btn");

  if (micModalCloseBtn && micPermissionModal) {
    micModalCloseBtn.addEventListener("click", () => {
      micPermissionModal.classList.remove("open");
    });
    micPermissionModal.addEventListener("click", (e) => {
      if (e.target === micPermissionModal) micPermissionModal.classList.remove("open");
    });
  }

  if (micLaunchStandaloneBtn) {
    micLaunchStandaloneBtn.addEventListener("click", () => {
      window.open(window.location.href, "_blank");
      if (micPermissionModal) micPermissionModal.classList.remove("open");
    });
  }

  const standaloneModePill = document.getElementById("standalone-mode-pill");
  if (standaloneModePill) {
    standaloneModePill.addEventListener("click", () => {
      window.open(window.location.href, "_blank");
    });
  }

  window.addEventListener("vox-listen-error", (e) => {
    micBtn.classList.remove("listening");
    micBtn.querySelector(".mic-btn-text").textContent = "Voice";
    setVoiceStatusBar(false);
    setVisualizerState("idle", "VOICE READY");
    
    const errType = e.detail?.error || "Notice";
    const customMsg = e.detail?.message;
    if (customMsg) {
      showToast(customMsg);
    } else if (errType === "permission-denied" || errType === "not-allowed" || errType.toLowerCase().includes("permission") || errType.toLowerCase().includes("allowed")) {
      showToast("🎙️ Mic Blocked: Click the 🔒 lock icon in your browser address bar to Allow Microphone.");
    } else {
      showToast("Microphone: " + errType);
    }
  });

  window.addEventListener("vox-speak-start", (e) => {
    setVoiceStatusBar(true, `Vocalizing in ${e.detail?.langCode || "native accent"}…`);
    setVisualizerState("speaking", "NEURAL TTS OUTPUT");
    if (stopSpeechAudioBtn) {
      stopSpeechAudioBtn.style.display = "inline-flex";
    }
  });

  window.addEventListener("vox-speak-end", () => {
    if (!window.isListening()) {
      setVoiceStatusBar(false);
      setVisualizerState("idle", "VOICE READY");
    }
    if (stopSpeechAudioBtn) {
      stopSpeechAudioBtn.style.display = "none";
    }
    if (currentSpeakingButton) {
      resetAudioButton(currentSpeakingButton);
    }
  });

  window.addEventListener("vox-speak-stop", () => {
    setVoiceStatusBar(false);
    setVisualizerState("idle", "VOICE READY");
    if (stopSpeechAudioBtn) {
      stopSpeechAudioBtn.style.display = "none";
    }
    if (currentSpeakingButton) {
      resetAudioButton(currentSpeakingButton);
    }
  });

  /* ================= SIDEBAR UI CONTROLS ================= */
  function openSidebar() {
    chatSidebar.classList.add("mobile-open");
    sidebarBackdrop.classList.add("open");
  }

  function closeSidebar() {
    chatSidebar.classList.remove("mobile-open");
    sidebarBackdrop.classList.remove("open");
  }

  function toggleSidebar() {
    if (window.innerWidth <= 768) {
      if (chatSidebar.classList.contains("mobile-open")) {
        closeSidebar();
      } else {
        openSidebar();
      }
    } else {
      chatSidebar.classList.toggle("collapsed");
    }
  }

  /* ================= EVENT LISTENERS ================= */
  if (messageInput) {
    messageInput.addEventListener("input", () => {
      messageInput.style.height = "auto";
      messageInput.style.height = Math.min(messageInput.scrollHeight, 110) + "px";
      if (charCount) charCount.textContent = `${messageInput.value.length} / 1000`;
    });

    messageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendQuery();
      }
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.altKey && (e.key === "m" || e.key === "M")) {
      e.preventDefault();
      window.toggleVoiceRecognition();
    }
    if (e.altKey && (e.key === "n" || e.key === "N")) {
      e.preventDefault();
      createNewConversation();
    }
  });

  if (currentChatTitle) {
    currentChatTitle.addEventListener("dblclick", () => {
      const conv = getActiveConversation();
      if (conv) renameConversation(conv.id);
    });
  }

  if (chatForm) {
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      sendQuery();
    });
  }

  if (micBtn) {
    micBtn.addEventListener("click", () => {
      if (window.isListening && window.isListening()) {
        window.stopVoiceRecognition();
      } else {
        window.startVoiceRecognition();
      }
    });
  }

  if (stopSpeechAudioBtn) {
    stopSpeechAudioBtn.addEventListener("click", () => {
      window.stopSpeaking();
      if (stopSpeechAudioBtn) stopSpeechAudioBtn.style.display = "none";
      setVoiceStatusBar(false);
      setVisualizerState("idle", "VOICE READY");
      showToast("⏹️ Audio playback stopped");
    });
  }

  if (sidebarToggleBtn) sidebarToggleBtn.addEventListener("click", toggleSidebar);
  if (sidebarBackdrop) sidebarBackdrop.addEventListener("click", closeSidebar);
  if (newChatBtn) newChatBtn.addEventListener("click", () => createNewConversation());
  if (historySearch) historySearch.addEventListener("input", () => renderSidebarHistory(historySearch.value));

  if (langPicker) {
    langPicker.addEventListener("change", () => {
      window.voiceLang = langPicker.value || undefined;
      showToast(
        langPicker.value
          ? `Speech accent set to ${langPicker.options[langPicker.selectedIndex].text}`
          : "Speech accent set to Auto-detect"
      );
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (clearModal) clearModal.classList.add("open");
    });
  }
  if (clearCancel) {
    clearCancel.addEventListener("click", () => {
      if (clearModal) clearModal.classList.remove("open");
    });
  }
  if (clearModal) {
    clearModal.addEventListener("click", (e) => {
      if (e.target === clearModal) clearModal.classList.remove("open");
    });
  }
  if (clearConfirm) {
    clearConfirm.addEventListener("click", () => {
      const conv = getActiveConversation();
      if (conv) {
        conv.messages = [];
        conv.title = "Multilingual Support Session";
        conv.primaryLanguage = "Auto-detect";
        conv.flag = "🌐";
        saveConversations();
        renderSidebarHistory();
        renderActiveConversation();
        showToast("Session cleared");
      }
      if (clearModal) clearModal.classList.remove("open");
    });
  }

  function openSettings() {
    if (settingsPanel) settingsPanel.classList.add("open");
    if (settingsBackdrop) settingsBackdrop.classList.add("open");
  }
  function closeSettings() {
    if (settingsPanel) settingsPanel.classList.remove("open");
    if (settingsBackdrop) settingsBackdrop.classList.remove("open");
  }

  if (settingsBtn) settingsBtn.addEventListener("click", openSettings);
  if (settingsTriggerBtn) settingsTriggerBtn.addEventListener("click", openSettings);
  if (settingsClose) settingsClose.addEventListener("click", closeSettings);
  if (settingsBackdrop) settingsBackdrop.addEventListener("click", closeSettings);

  if (darkToggle) darkToggle.addEventListener("change", persistCurrentSettings);
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      if (darkToggle) darkToggle.checked = !darkToggle.checked;
      persistCurrentSettings();
    });
  }
  if (homeThemeToggle) {
    homeThemeToggle.addEventListener("click", () => {
      if (darkToggle) darkToggle.checked = !darkToggle.checked;
      persistCurrentSettings();
    });
  }

  if (autospeakToggle) autospeakToggle.addEventListener("change", persistCurrentSettings);
  if (handsfreeToggle) handsfreeToggle.addEventListener("change", persistCurrentSettings);
  if (quickHandsfreeToggle) {
    quickHandsfreeToggle.addEventListener("click", () => {
      if (handsfreeToggle) handsfreeToggle.checked = !handsfreeToggle.checked;
      persistCurrentSettings();
      showToast(window.handsFree ? "Hands-free continuous mode enabled" : "Hands-free continuous mode disabled");
    });
  }
  if (speedSlider) speedSlider.addEventListener("input", persistCurrentSettings);
  if (showTranslationsToggle) showTranslationsToggle.addEventListener("change", persistCurrentSettings);

  // Voice Gender Tone Controls (Female / Male)
  if (headerGenderPicker) {
    headerGenderPicker.addEventListener("change", () => {
      handleGenderChange(headerGenderPicker.value);
    });
  }
  if (homeVoiceGenderPicker) {
    homeVoiceGenderPicker.addEventListener("change", () => {
      handleGenderChange(homeVoiceGenderPicker.value);
    });
  }
  if (modalGenderFemale) {
    modalGenderFemale.addEventListener("click", () => {
      handleGenderChange("female");
    });
  }
  if (modalGenderMale) {
    modalGenderMale.addEventListener("click", () => {
      handleGenderChange("male");
    });
  }
  if (genderBtnFemale) {
    genderBtnFemale.addEventListener("click", () => {
      handleGenderChange("female");
    });
  }
  if (genderBtnMale) {
    genderBtnMale.addEventListener("click", () => {
      handleGenderChange("male");
    });
  }
  if (testVoiceBtn) {
    testVoiceBtn.addEventListener("click", () => {
      const g = window.voiceGender === "male" ? "male" : "female";
      const sample = g === "male"
        ? "Hello! This is the male voice persona for VoxBridge. How may I assist your business today?"
        : "Hello! This is the female voice persona for VoxBridge. How can I help you today?";
      const currentAccent = langPicker ? langPicker.value || "en-US" : "en-US";
      window.speak(sample, currentAccent);
    });
  }

  // Voice Test Previews in Header and Name Modal
  const modalTestVoiceBtn = document.getElementById("modal-test-voice-btn");
  const headerTestVoiceBtn = document.getElementById("header-test-voice-btn");

  function playSampleVoice(gender) {
    const g = gender || window.voiceGender || "female";
    const sample = g === "male"
      ? "Hello! This is the male voice persona for VoxBridge. Crisp, clear, and executive."
      : "Hello! This is the female voice persona for VoxBridge. Warm, expressive, and natural.";
    const currentAccent = langPicker ? langPicker.value || "en-US" : "en-US";
    window.speak(sample, currentAccent);
  }

  if (modalTestVoiceBtn) {
    modalTestVoiceBtn.addEventListener("click", () => {
      const activeBtn = document.querySelector("#name-modal .gender-segment-btn.active");
      const g = activeBtn ? activeBtn.dataset.gender : window.voiceGender;
      playSampleVoice(g);
    });
  }
  if (headerTestVoiceBtn) {
    headerTestVoiceBtn.addEventListener("click", () => {
      playSampleVoice(window.voiceGender);
    });
  }

  /* ================= SHORTCUTS MODAL ================= */
  const shortcutsBtn = document.getElementById("shortcuts-btn");
  const shortcutsModal = document.getElementById("shortcuts-modal");
  const shortcutsModalClose = document.getElementById("shortcuts-modal-close");

  if (shortcutsBtn && shortcutsModal) {
    shortcutsBtn.addEventListener("click", () => {
      shortcutsModal.classList.add("open");
      shortcutsModal.setAttribute("aria-hidden", "false");
    });
  }
  if (shortcutsModalClose && shortcutsModal) {
    shortcutsModalClose.addEventListener("click", () => {
      shortcutsModal.classList.remove("open");
      shortcutsModal.setAttribute("aria-hidden", "true");
    });
  }
  if (shortcutsModal) {
    shortcutsModal.addEventListener("click", (e) => {
      if (e.target === shortcutsModal) {
        shortcutsModal.classList.remove("open");
        shortcutsModal.setAttribute("aria-hidden", "true");
      }
    });
  }

  /* ================= EXPORT TRANSCRIPTS (TXT & PDF) ================= */
  const exportModal = document.getElementById("export-modal");
  const exportModalClose = document.getElementById("export-modal-close");
  const exportFormatTxt = document.getElementById("export-format-txt");
  const exportFormatPdf = document.getElementById("export-format-pdf");

  function openExportModal() {
    if (exportModal) {
      exportModal.classList.add("open");
      exportModal.setAttribute("aria-hidden", "false");
    }
  }
  function closeExportModal() {
    if (exportModal) {
      exportModal.classList.remove("open");
      exportModal.setAttribute("aria-hidden", "true");
    }
  }

  if (exportChatBtn) exportChatBtn.addEventListener("click", openExportModal);
  if (exportAllBtn) exportAllBtn.addEventListener("click", openExportModal);
  if (exportModalClose) exportModalClose.addEventListener("click", closeExportModal);
  if (exportModal) {
    exportModal.addEventListener("click", (e) => {
      if (e.target === exportModal) closeExportModal();
    });
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Saved ${filename}`);
    closeExportModal();
  }

  if (exportFormatTxt) {
    exportFormatTxt.addEventListener("click", () => {
      const conv = getActiveConversation();
      if (!conv || !conv.messages.length) {
        showToast("No messages to save");
        return;
      }
      let txt = `VOXBRIDGE MULTILINGUAL TRANSCRIPT\nCustomer: ${conv.customerName || customerName}\nSession: ${conv.title}\nPrimary Language: ${conv.primaryLanguage || "Auto-detect"}\nDate: ${new Date(conv.createdAt).toLocaleString()}\n${"-".repeat(50)}\n\n`;
      conv.messages.forEach((m) => {
        const who = m.who === "user" ? (conv.customerName || customerName) : "VoxBridge Assistant";
        txt += `[${m.timestamp}] ${who}:\n${m.text}\n`;
        if (m.translation && m.translation !== m.text) {
          txt += `(English Translation: ${m.translation})\n`;
        }
        txt += "\n";
      });
      downloadFile(`voxbridge-${conv.id || "chat"}.txt`, txt, "text/plain");
    });
  }

  if (exportFormatPdf) {
    exportFormatPdf.addEventListener("click", () => {
      const conv = getActiveConversation();
      if (!conv || !conv.messages.length) {
        showToast("No messages to print or save as PDF");
        return;
      }
      closeExportModal();
      setTimeout(() => {
        window.print();
      }, 200);
    });
  }

  /* ================= UNIVERSAL ESCAPE KEY DISPATCHER ================= */
  window.addEventListener("keydown", (e) => {
    // Check Alt hotkeys first
    if (e.altKey && (e.key === "m" || e.key === "M")) {
      e.preventDefault();
      if (window.toggleVoiceRecognition) window.toggleVoiceRecognition();
      return;
    }
    if (e.altKey && (e.key === "n" || e.key === "N")) {
      e.preventDefault();
      if (newChatBtn) newChatBtn.click();
      return;
    }
    if (e.altKey && (e.key === "t" || e.key === "T")) {
      e.preventDefault();
      if (themeToggle) themeToggle.click();
      return;
    }
    if (e.altKey && (e.key === "s" || e.key === "S")) {
      e.preventDefault();
      openSettings();
      return;
    }

    // Universal Escape Handling across ANY open window / state
    if (e.key === "Escape" || e.code === "Escape") {
      let handled = false;

      // 1. Close Settings Drawer
      if (settingsPanel && settingsPanel.classList.contains("open")) {
        closeSettings();
        handled = true;
      }

      // 2. Close Shortcuts Modal
      if (shortcutsModal && shortcutsModal.classList.contains("open")) {
        shortcutsModal.classList.remove("open");
        shortcutsModal.setAttribute("aria-hidden", "true");
        handled = true;
      }

      // 3. Close Export Modal
      if (exportModal && exportModal.classList.contains("open")) {
        closeExportModal();
        handled = true;
      }

      // 4. Close Clear Modal
      if (clearModal && clearModal.classList.contains("open")) {
        clearModal.classList.remove("open");
        handled = true;
      }

      // 4.2 Close Delete Session Confirmation Modal
      if (deleteSessionModal && deleteSessionModal.classList.contains("open")) {
        closeDeleteModal();
        handled = true;
      }

      // 4.5 Close Ticket Modal
      const ticketModal = document.getElementById("ticket-modal");
      if (ticketModal && ticketModal.classList.contains("open")) {
        ticketModal.classList.remove("open");
        ticketModal.setAttribute("aria-hidden", "true");
        handled = true;
      }

      // 5. Close Mic Permission Modal
      const micModal = document.getElementById("mic-permission-modal");
      if (micModal && micModal.classList.contains("open")) {
        micModal.classList.remove("open");
        micModal.setAttribute("aria-hidden", "true");
        handled = true;
      }

      // 6. Close Name Entry Modal (if customer already has a valid name saved)
      if (nameModal && nameModal.classList.contains("open")) {
        if (customerName && customerName !== "Customer") {
          closeNameModal();
          handled = true;
        } else {
          showToast("⚠️ Name required to enter VoxBridge.");
          if (modalUserNameInput) modalUserNameInput.focus();
          handled = true;
        }
      }

      // 7. Close Mobile Sidebar Drawer
      if (chatSidebar && chatSidebar.classList.contains("mobile-open")) {
        chatSidebar.classList.remove("mobile-open");
        if (sidebarBackdrop) sidebarBackdrop.classList.remove("visible");
        handled = true;
      }

      // 8. Stop Voice Playback if actively speaking
      if (window.isSpeaking && window.isSpeaking()) {
        window.stopSpeaking();
        showToast("⏹️ Audio playback stopped (Esc)");
        handled = true;
      }

      // 9. Stop Microphone if actively recording/listening
      if (window.isListening && window.isListening()) {
        window.stopVoiceRecognition();
        showToast("⏹️ Microphone stopped (Esc)");
        handled = true;
      }

      // 10. Blur active element if focused
      if (document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")) {
        document.activeElement.blur();
        handled = true;
      }

      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  });

  document.querySelectorAll(".prompt-tile").forEach((tile) => {
    tile.addEventListener("click", () => {
      const promptText = tile.getAttribute("data-text");
      if (promptText) {
        sendQuery(promptText);
      }
    });
  });

  /* ================= POST-ENTRY STARTER VOICE PERSONA SELECTORS ================= */
  const starterGenderFemale = document.getElementById("starter-gender-female");
  const starterGenderMale = document.getElementById("starter-gender-male");
  const starterTestVoiceBtn = document.getElementById("starter-test-voice-btn");

  if (starterGenderFemale) {
    starterGenderFemale.addEventListener("click", () => {
      handleGenderChange("female");
    });
  }
  if (starterGenderMale) {
    starterGenderMale.addEventListener("click", () => {
      handleGenderChange("male");
    });
  }
  if (starterTestVoiceBtn) {
    starterTestVoiceBtn.addEventListener("click", () => {
      playSampleVoice(window.voiceGender);
    });
  }

  /* ================= BUSINESS CARE DOCK CHIPS ================= */
  document.querySelectorAll(".care-quick-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      if (chip.classList.contains("ticket-trigger-btn") || chip.id === "dock-ticket-btn") {
        openTicketModal();
        return;
      }
      const prompt = chip.getAttribute("data-prompt");
      if (prompt) {
        sendQuery(prompt);
      }
    });
  });

  /* ================= SUPPORT TICKET & TICKET HISTORY CENTER ================= */
  const TICKETS_STORAGE_KEY = "voxbridge_support_tickets";
  let supportTickets = [];
  let currentTicketFilter = "all";
  let currentTicketSearch = "";

  const sidebarTicketsBtn = document.getElementById("sidebar-tickets-btn");
  const dockTicketBtn = document.getElementById("dock-ticket-btn");
  const ticketModal = document.getElementById("ticket-modal");
  const ticketCloseXBtn = document.getElementById("ticket-close-x-btn");
  const ticketCancelBtn = document.getElementById("ticket-cancel-btn");
  const ticketSubmitBtn = document.getElementById("ticket-submit-btn");

  const tabTicketHistoryBtn = document.getElementById("tab-ticket-history-btn");
  const tabTicketCreateBtn = document.getElementById("tab-ticket-create-btn");
  const ticketHistoryPanel = document.getElementById("ticket-history-panel");
  const ticketCreatePanel = document.getElementById("ticket-create-panel");
  const ticketCardsList = document.getElementById("ticket-cards-list");
  const ticketHistorySearch = document.getElementById("ticket-history-search");

  const ticketCountBadge = document.getElementById("ticket-count-badge");
  const sidebarTicketBadge = document.getElementById("sidebar-ticket-badge");
  const ticketTabCount = document.getElementById("ticket-tab-count");

  const ticketCustomerName = document.getElementById("ticket-customer-name");
  const ticketPriority = document.getElementById("ticket-priority");
  const ticketCategory = document.getElementById("ticket-category");
  const ticketSummary = document.getElementById("ticket-summary");
  const generatedTicketId = document.getElementById("generated-ticket-id");

  function loadTickets() {
    try {
      const data = localStorage.getItem(TICKETS_STORAGE_KEY);
      if (data) {
        supportTickets = JSON.parse(data);
      }
    } catch (e) {
      supportTickets = [];
    }
    if (!Array.isArray(supportTickets)) supportTickets = [];
    updateTicketBadges();
  }

  function saveTickets() {
    try {
      localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(supportTickets));
    } catch (e) {}
    updateTicketBadges();
  }

  function updateTicketBadges() {
    const total = supportTickets.length;
    const openCount = supportTickets.filter((t) => t.status !== "Resolved").length;

    if (ticketCountBadge) {
      ticketCountBadge.textContent = String(openCount);
      ticketCountBadge.style.display = openCount > 0 ? "inline-block" : "none";
    }
    if (sidebarTicketBadge) {
      sidebarTicketBadge.textContent = String(total);
    }
    if (ticketTabCount) {
      ticketTabCount.textContent = String(total);
    }
  }

  function renderTicketCards() {
    if (!ticketCardsList) return;
    ticketCardsList.innerHTML = "";

    const filtered = supportTickets.filter((t) => {
      // Status filter
      if (currentTicketFilter !== "all" && t.status !== currentTicketFilter) {
        return false;
      }
      // Search query filter
      if (currentTicketSearch.trim()) {
        const query = currentTicketSearch.toLowerCase();
        const matchesId = (t.id || "").toLowerCase().includes(query);
        const matchesCat = (t.category || "").toLowerCase().includes(query);
        const matchesSummary = (t.summary || "").toLowerCase().includes(query);
        return matchesId || matchesCat || matchesSummary;
      }
      return true;
    });

    if (filtered.length === 0) {
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "ticket-empty-state";
      emptyDiv.innerHTML = `
        <div class="ticket-empty-icon">🎫</div>
        <strong>No Support Tickets Found</strong>
        <p>${supportTickets.length === 0 ? "You haven't submitted any support tickets yet." : "No tickets matching your current filter."}</p>
        <button type="button" class="dialog-btn primary-confirm" style="margin: 0 auto; display: inline-flex;" onclick="window.switchTicketTab('create')">
          ➕ Raise a New Ticket
        </button>
      `;
      ticketCardsList.appendChild(emptyDiv);
      return;
    }

    filtered.forEach((ticket) => {
      const card = document.createElement("div");
      card.className = "ticket-card-item";

      const statusClass =
        ticket.status === "Resolved"
          ? "status-resolved"
          : ticket.status === "In Review"
          ? "status-in-review"
          : "status-open";

      const priorityClass =
        ticket.priority === "Urgent"
          ? "priority-urgent"
          : ticket.priority === "High"
          ? "priority-high"
          : "priority-normal";

      card.innerHTML = `
        <div class="ticket-card-top">
          <div class="ticket-badges-group">
            <span class="ticket-id-badge">${escapeHtml(ticket.id)}</span>
            <span class="ticket-status-tag ${statusClass}">${escapeHtml(ticket.status || "Open")}</span>
            <span class="ticket-priority-tag ${priorityClass}">⚡ ${escapeHtml(ticket.priority || "Normal")}</span>
          </div>
          <span class="ticket-card-category">${escapeHtml(ticket.category)}</span>
        </div>
        <div class="ticket-card-body">
          ${escapeHtml(ticket.summary || "Customer support inquiry")}
        </div>
        <div class="ticket-card-footer">
          <span>🕒 Created: ${escapeHtml(ticket.createdAt || "")}</span>
          <div class="ticket-card-actions">
            <button type="button" class="ticket-mini-action-btn copy-ticket-id-btn" title="Copy Ticket Reference">
              📋 Copy ID
            </button>
            ${
              ticket.status !== "Resolved"
                ? `<button type="button" class="ticket-mini-action-btn resolve-ticket-btn" style="color:#10b981;">
                    ✓ Mark Resolved
                  </button>`
                : `<button type="button" class="ticket-mini-action-btn reopen-ticket-btn">
                    🔄 Reopen
                  </button>`
            }
          </div>
        </div>
      `;

      // Copy Ticket ID
      const copyBtn = card.querySelector(".copy-ticket-id-btn");
      if (copyBtn) {
        copyBtn.onclick = () => {
          navigator.clipboard.writeText(ticket.id).then(() => {
            showToast(`Copied ${ticket.id} to clipboard!`);
          });
        };
      }

      // Mark Resolved
      const resolveBtn = card.querySelector(".resolve-ticket-btn");
      if (resolveBtn) {
        resolveBtn.onclick = () => {
          ticket.status = "Resolved";
          ticket.resolvedAt = formatTime();
          saveTickets();
          renderTicketCards();
          showToast(`Ticket ${ticket.id} marked as Resolved.`);
        };
      }

      // Reopen Ticket
      const reopenBtn = card.querySelector(".reopen-ticket-btn");
      if (reopenBtn) {
        reopenBtn.onclick = () => {
          ticket.status = "Open";
          saveTickets();
          renderTicketCards();
          showToast(`Ticket ${ticket.id} reopened.`);
        };
      }

      ticketCardsList.appendChild(card);
    });
  }

  function switchTicketTab(tabName) {
    if (tabName === "history") {
      if (tabTicketHistoryBtn) tabTicketHistoryBtn.classList.add("active");
      if (tabTicketCreateBtn) tabTicketCreateBtn.classList.remove("active");
      if (ticketHistoryPanel) ticketHistoryPanel.classList.add("active");
      if (ticketCreatePanel) ticketCreatePanel.classList.remove("active");
      renderTicketCards();
    } else {
      if (tabTicketCreateBtn) tabTicketCreateBtn.classList.add("active");
      if (tabTicketHistoryBtn) tabTicketHistoryBtn.classList.remove("active");
      if (ticketCreatePanel) ticketCreatePanel.classList.add("active");
      if (ticketHistoryPanel) ticketHistoryPanel.classList.remove("active");

      // Populate fresh ID and customer name
      const ticketId = "#VB-" + Math.floor(10000 + Math.random() * 90000);
      if (generatedTicketId) generatedTicketId.textContent = ticketId;
      if (ticketCustomerName) ticketCustomerName.value = customerName || "Customer";

      if (ticketSummary && !ticketSummary.value) {
        const conv = getActiveConversation();
        const lastUserMsg = conv ? [...conv.messages].reverse().find((m) => m.who === "user") : null;
        if (lastUserMsg) {
          ticketSummary.value = `Inquiry regarding: "${lastUserMsg.text}"`;
        }
      }
    }
  }
  window.switchTicketTab = switchTicketTab;

  function openTicketModal(initialTab = "history") {
    if (!ticketModal) return;
    loadTickets();

    // Default to history if tickets exist, otherwise create
    const targetTab = initialTab === "create" || supportTickets.length === 0 ? "create" : "history";
    switchTicketTab(targetTab);

    ticketModal.classList.add("open");
    ticketModal.setAttribute("aria-hidden", "false");
  }

  function closeTicketModal() {
    if (ticketModal) {
      ticketModal.classList.remove("open");
      ticketModal.setAttribute("aria-hidden", "true");
    }
  }

  if (sidebarTicketsBtn) sidebarTicketsBtn.addEventListener("click", () => openTicketModal("history"));
  if (dockTicketBtn) dockTicketBtn.addEventListener("click", () => openTicketModal("create"));

  if (tabTicketHistoryBtn) tabTicketHistoryBtn.addEventListener("click", () => switchTicketTab("history"));
  if (tabTicketCreateBtn) tabTicketCreateBtn.addEventListener("click", () => switchTicketTab("create"));

  if (ticketCloseXBtn) ticketCloseXBtn.addEventListener("click", closeTicketModal);
  if (ticketCancelBtn) ticketCancelBtn.addEventListener("click", closeTicketModal);

  if (ticketModal) {
    ticketModal.addEventListener("click", (e) => {
      if (e.target === ticketModal) closeTicketModal();
    });
  }

  // Ticket Status Filter Pills
  document.querySelectorAll(".status-filter-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".status-filter-pill").forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      currentTicketFilter = pill.getAttribute("data-filter") || "all";
      renderTicketCards();
    });
  });

  // Ticket Search
  if (ticketHistorySearch) {
    ticketHistorySearch.addEventListener("input", () => {
      currentTicketSearch = ticketHistorySearch.value;
      renderTicketCards();
    });
  }

  if (ticketSubmitBtn) {
    ticketSubmitBtn.addEventListener("click", () => {
      const ticketId = generatedTicketId ? generatedTicketId.textContent : "#VB-" + Math.floor(10000 + Math.random() * 90000);
      const cat = ticketCategory ? ticketCategory.value : "General Support";
      const priority = ticketPriority ? ticketPriority.value : "Normal";
      const summaryText = ticketSummary ? ticketSummary.value.trim() : "";

      const newTicket = {
        id: ticketId,
        customerName: customerName || "Customer",
        category: cat,
        priority: priority,
        summary: summaryText || "Customer support case escalation",
        status: "Open",
        createdAt: new Date().toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        conversationId: activeConvId,
      };

      supportTickets.unshift(newTicket);
      saveTickets();

      if (ticketSummary) ticketSummary.value = "";
      closeTicketModal();
      showToast(`Support Ticket ${ticketId} created & logged!`);

      const conv = getActiveConversation();
      if (conv) {
        const ticketBotMsg = {
          id: "t_" + Date.now(),
          who: "bot",
          text: `🎫 Support Ticket (${ticketId}) has been logged for ${customerName || "Customer"}.\n\n• Category: ${cat}\n• Priority Level: ${priority}\n• Status: 🟢 Open (Escalated to Tier-2 Support Queue)\n\nOur specialists have received your inquiry. You can track this anytime in your Support Tickets tab!`,
          translation: `Formal Support Ticket (${ticketId}) has been escalated with ${priority} priority.`,
          language: conv.primaryLanguage || "English",
          lang_code: window.voiceLang || "en-US",
          detected_language: conv.activeLang || "en",
          intent: "Ticket Escalation",
          sentiment: "Positive",
          suggestions: ["Check ticket status", "Track order", "Return to chat"],
          timestamp: formatTime(),
        };
        conv.messages.push(ticketBotMsg);
        saveConversations();
        appendMessageElement(ticketBotMsg);
        scrollToBottom();
      }
    });
  }

  /* ================= INITIALIZATION ================= */
  const savedSettings = loadSettings();
  applySettings(savedSettings);
  updateCustomerName(customerName);
  loadConversations();
  loadTickets();
  renderSidebarHistory();
  renderActiveConversation();
  startVisualizer();

  window.addEventListener("online", () => {
    showToast("🟢 Connected: Internet access restored.");
  });
  window.addEventListener("offline", () => {
    showToast("⚠️ Network disconnected: You are currently offline.");
  });

  window.addEventListener("load", () => {
    setTimeout(() => {
      if (loadingScreen) loadingScreen.classList.add("hidden");
    }, 380);
  });
})();
