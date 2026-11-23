// Cấu hình Web3Forms để nhận kết quả chốt kèo về Email
// Lấy Access Key miễn phí (mất 10 giây) tại: https://web3forms.com/
const WEB3FORMS_CONFIG = {
  endpoint: "https://api.web3forms.com/submit",
  accessKey: "778f9459-423c-4ee1-b643-d4db68aab0c0",
};

const now = new Date();

const AppState = {
  step: 1,
  food: null,
  date: null,
  time: null,
  calMonth: now.getMonth(),
  calYear: now.getFullYear(),
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const pages = {
  1: $("#page1"),
  2: $("#page2"),
  3: $("#page3"),
  4: $("#page4"),
};

const stepItems = $$(".stepper .step");
const foodItems = $$(".food-item");
const foodNextBtn = $("#foodNextBtn");
const foodError = $("#foodError");
const dateSetBtn = $("#dateSetBtn");
const dateError = $("#dateError");
const calendarGrid = $("#calendarGrid");
const calMonthYear = $("#calMonthYear");
const calPrev = $("#calPrev");
const calNext = $("#calNext");
const timeGrid = $("#timeGrid");
const confirmDate = $("#confirmDate");
const confirmTime = $("#confirmTime");
const confirmFood = $("#confirmFood");
const sendStatus = $("#sendStatus");
const resetBtn = $("#resetBtn");
const noBtn = $("#noBtn");
const noMessage = $("#noMessage");
const retryNoBtn = $("#retryNoBtn");
const acceptAfterNoBtn = $("#acceptAfterNoBtn");
const invitationActions = $("#invitationActions");
const yesBtn = $("#yesBtn");
const confettiOverlay = $("#confettiOverlay");
const heartsContainer = $("#heartsContainer");
const visualKicker = $("#visualKicker");
const visualTitle = $("#visualTitle");

const TIME_SLOTS = [
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
];

const DAYS_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTHS = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

const VISUAL_COPY = {
  1: ["Một câu hỏi nhỏ xíu...", "Nhưng độ dễ thương thì rất to!"],
  2: ["Đến phần ngon nhất rồi!", "Món nào cũng được, miễn là cùng nhau."],
  3: ["Sắp thành kèo thật rồi...", "Chọn một ngày đẹp trời để gặp nhau nhé."],
  4: ["Ting ting! Chốt đơn thành công", "Một buổi hẹn đáng mong chờ đang đến!"],
};

function initFloatingHearts() {
  const symbols = ["♥", "✦", "●", "✿", "♡"];

  for (let index = 0; index < 12; index += 1) {
    const element = document.createElement("span");
    element.className = "heart-float";
    element.textContent = symbols[index % symbols.length];
    element.style.left = `${Math.random() * 100}%`;
    element.style.fontSize = `${0.7 + Math.random() * 1.1}rem`;
    element.style.animationDuration = `${10 + Math.random() * 8}s`;
    element.style.animationDelay = `${Math.random() * 8}s`;
    heartsContainer.appendChild(element);
  }
}

function goToStep(step, shouldFocus = true) {
  AppState.step = step;

  Object.entries(pages).forEach(([pageNumber, page]) => {
    const isActive = Number(pageNumber) === step;
    page.classList.toggle("active", isActive);
    page.setAttribute("aria-hidden", String(!isActive));
  });

  stepItems.forEach((item, index) => {
    const stepNumber = index + 1;
    item.classList.toggle("active", stepNumber === step);
    item.classList.toggle("done", stepNumber < step);
    if (stepNumber === step) {
      item.setAttribute("aria-current", "step");
    } else {
      item.removeAttribute("aria-current");
    }
  });

  [visualKicker.textContent, visualTitle.textContent] = VISUAL_COPY[step];

  if (shouldFocus) {
    const heading = pages[step].querySelector("h1, h2");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      requestAnimationFrame(() => heading.focus({ preventScroll: true }));
    }
    $("#appCard").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (step === 4) {
    launchConfetti();
  }
}

yesBtn.addEventListener("click", () => goToStep(2));
acceptAfterNoBtn.addEventListener("click", () => goToStep(2));

noBtn.addEventListener("click", () => {
  invitationActions.hidden = true;
  noMessage.hidden = false;
  retryNoBtn.focus();
});

retryNoBtn.addEventListener("click", () => {
  noMessage.hidden = true;
  invitationActions.hidden = false;
  yesBtn.focus();
});

$$('[data-back-step]').forEach((button) => {
  button.addEventListener("click", () => goToStep(Number(button.dataset.backStep)));
});

foodItems.forEach((item) => {
  item.addEventListener("click", () => {
    foodItems.forEach((foodItem) => {
      foodItem.classList.remove("selected");
      foodItem.setAttribute("aria-pressed", "false");
    });

    item.classList.add("selected");
    item.setAttribute("aria-pressed", "true");
    AppState.food = item.dataset.food;
    foodNextBtn.disabled = false;
    foodError.hidden = true;
  });
});

foodNextBtn.addEventListener("click", () => {
  if (!AppState.food) {
    foodError.hidden = false;
    return;
  }

  goToStep(3);
  renderCalendar();
  renderTimes();
});

function getMonthKey(year, month) {
  return year * 12 + month;
}

function getAllowedCalendarRange() {
  const currentDate = new Date();
  const min = {
    year: currentDate.getFullYear(),
    month: currentDate.getMonth(),
  };
  const nextMonth = new Date(min.year, min.month + 1, 1);
  const max = {
    year: nextMonth.getFullYear(),
    month: nextMonth.getMonth(),
  };

  return { min, max };
}

function formatDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function updateCalendarNavigation() {
  const { min, max } = getAllowedCalendarRange();
  const currentKey = getMonthKey(AppState.calYear, AppState.calMonth);

  calPrev.disabled = currentKey <= getMonthKey(min.year, min.month);
  calNext.disabled = currentKey >= getMonthKey(max.year, max.month);
}

function renderCalendar() {
  const { calMonth, calYear } = AppState;
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date();
  const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  calMonthYear.textContent = `${MONTHS[calMonth]}, ${calYear}`;
  calendarGrid.replaceChildren();

  DAYS_SHORT.forEach((label) => {
    const dayLabel = document.createElement("div");
    dayLabel.className = "day-label";
    dayLabel.textContent = label;
    dayLabel.setAttribute("aria-hidden", "true");
    calendarGrid.appendChild(dayLabel);
  });

  for (let index = 0; index < firstDay; index += 1) {
    const emptyCell = document.createElement("span");
    emptyCell.className = "day empty";
    emptyCell.setAttribute("aria-hidden", "true");
    calendarGrid.appendChild(emptyCell);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = formatDateKey(calYear, calMonth, day);
    const dayButton = document.createElement("button");
    const isPast = dateKey < todayKey;
    const isSelected = AppState.date === dateKey;
    const isToday = dateKey === todayKey;

    dayButton.type = "button";
    dayButton.className = "day";
    dayButton.textContent = String(day);
    dayButton.disabled = isPast;
    dayButton.dataset.date = dateKey;
    dayButton.setAttribute(
      "aria-label",
      `${day} ${MONTHS[calMonth].toLowerCase()} năm ${calYear}${isPast ? ", đã qua" : ""}`,
    );
    dayButton.setAttribute("aria-pressed", String(isSelected));
    dayButton.classList.toggle("selected", isSelected);
    dayButton.classList.toggle("today", isToday);

    dayButton.addEventListener("click", () => {
      AppState.date = dateKey;
      renderCalendar();
      checkDateTime();
    });

    calendarGrid.appendChild(dayButton);
  }

  updateCalendarNavigation();
}

calPrev.addEventListener("click", () => {
  const { min } = getAllowedCalendarRange();
  const currentKey = getMonthKey(AppState.calYear, AppState.calMonth);
  if (currentKey <= getMonthKey(min.year, min.month)) return;

  const previousMonth = new Date(AppState.calYear, AppState.calMonth - 1, 1);
  AppState.calMonth = previousMonth.getMonth();
  AppState.calYear = previousMonth.getFullYear();
  renderCalendar();
});

calNext.addEventListener("click", () => {
  const { max } = getAllowedCalendarRange();
  const currentKey = getMonthKey(AppState.calYear, AppState.calMonth);
  if (currentKey >= getMonthKey(max.year, max.month)) return;

  const nextMonth = new Date(AppState.calYear, AppState.calMonth + 1, 1);
  AppState.calMonth = nextMonth.getMonth();
  AppState.calYear = nextMonth.getFullYear();
  renderCalendar();
});

function renderTimes() {
  timeGrid.replaceChildren();

  TIME_SLOTS.forEach((time) => {
    const timeButton = document.createElement("button");
    const isSelected = AppState.time === time;

    timeButton.type = "button";
    timeButton.className = "time-item";
    timeButton.textContent = time;
    timeButton.dataset.time = time;
    timeButton.classList.toggle("selected", isSelected);
    timeButton.setAttribute("aria-pressed", String(isSelected));

    timeButton.addEventListener("click", () => {
      AppState.time = time;
      renderTimes();
      checkDateTime();
    });

    timeGrid.appendChild(timeButton);
  });
}

function checkDateTime() {
  const isComplete = Boolean(AppState.date && AppState.time);
  dateSetBtn.disabled = !isComplete;
  if (isComplete) dateError.hidden = true;
}

async function sendDateResult({ formattedDate, rawDate, time, food }) {
  const key = WEB3FORMS_CONFIG.accessKey?.trim();
  if (!key || key === "YOUR_WEB3FORMS_ACCESS_KEY") {
    console.warn("[Web3Forms] Chưa cấu hình accessKey trong js/app.js.");
    return { status: "skipped" };
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(WEB3FORMS_CONFIG.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        access_key: key,
        subject: `💕 Chốt kèo hẹn hò: ${food} lúc ${time} (${formattedDate})`,
        from_name: "Lời mời hẹn hò 💕",
        "Món đã chọn": food,
        "Ngày hẹn": `${formattedDate} (${rawDate})`,
        "Giờ gặp": time,
        "Thời điểm chốt": new Intl.DateTimeFormat("vi-VN", {
          dateStyle: "full",
          timeStyle: "medium",
        }).format(new Date()),
        "Thiết bị": /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
          ? "Điện thoại"
          : "Máy tính",
      }),
    });

    const data = await response.json().catch(() => null);
    if (response.ok && data?.success) {
      return { status: "sent" };
    }
    return { status: "error" };
  } catch {
    return { status: "error" };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function updateSendStatus(status) {
  sendStatus.classList.remove("is-success", "is-fallback");

  if (status === "sent") {
    sendStatus.textContent = "Đã gửi vé hẹn thành công 💌";
    sendStatus.classList.add("is-success");
    sendStatus.hidden = false;
  } else if (status === "error") {
    sendStatus.textContent = "Chụp màn hình vé hẹn này gửi lại cho mình nhé 📸";
    sendStatus.classList.add("is-fallback");
    sendStatus.hidden = false;
  } else {
    sendStatus.textContent = "";
    sendStatus.hidden = true;
  }
}

dateSetBtn.addEventListener("click", async () => {
  if (!AppState.date || !AppState.time) {
    dateError.hidden = false;
    return;
  }

  const selectedDate = new Date(`${AppState.date}T00:00:00`);
  const formattedDate = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(selectedDate);
  const displayDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const originalBtnHtml = dateSetBtn.innerHTML;
  dateSetBtn.disabled = true;
  dateSetBtn.textContent = "Đang chốt kèo... 💌";

  const result = await sendDateResult({
    formattedDate: displayDate,
    rawDate: AppState.date,
    time: AppState.time,
    food: AppState.food,
  });

  dateSetBtn.innerHTML = originalBtnHtml;
  dateSetBtn.disabled = false;

  confirmDate.textContent = displayDate;
  confirmTime.textContent = AppState.time;
  confirmFood.textContent = AppState.food;
  updateSendStatus(result.status);
  goToStep(4);
});

function launchConfetti() {
  const colors = ["#ff6b81", "#ffd166", "#6edcc4", "#a78bfa", "#ff9eb0"];
  confettiOverlay.replaceChildren();

  for (let index = 0; index < 52; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.width = `${6 + Math.random() * 7}px`;
    piece.style.height = `${8 + Math.random() * 9}px`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.borderRadius = Math.random() > 0.55 ? "50%" : "2px";
    piece.style.animationDuration = `${1.25 + Math.random() * 0.85}s`;
    piece.style.animationDelay = `${Math.random() * 0.55}s`;
    confettiOverlay.appendChild(piece);
  }

  window.setTimeout(() => confettiOverlay.replaceChildren(), 2800);
}

function resetApp() {
  const currentDate = new Date();
  AppState.food = null;
  AppState.date = null;
  AppState.time = null;
  AppState.calMonth = currentDate.getMonth();
  AppState.calYear = currentDate.getFullYear();

  foodItems.forEach((item) => {
    item.classList.remove("selected");
    item.setAttribute("aria-pressed", "false");
  });

  foodNextBtn.disabled = true;
  dateSetBtn.disabled = true;
  foodError.hidden = true;
  dateError.hidden = true;
  noMessage.hidden = true;
  invitationActions.hidden = false;
  updateSendStatus("skipped");
  confettiOverlay.replaceChildren();
  renderCalendar();
  renderTimes();
  goToStep(1);
}

resetBtn.addEventListener("click", resetApp);

initFloatingHearts();
renderCalendar();
renderTimes();
goToStep(1, false);
