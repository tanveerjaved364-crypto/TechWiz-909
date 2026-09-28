// SkillSprint AI - Employee Learning Portal Controller

function getElement(selector) {
  return document.querySelector(selector);
}

function escapeHtml(value) {
  const htmlCharacters = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };
  return String(value ?? "").replace(
    /[&<>]/g,
    (character) => htmlCharacters[character],
  );
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(
      responseData.error || "The request could not be completed.",
    );
  }

  return responseData;
}

function showNotice(message, isError = false) {
  const noticeElement = getElement("#notice");
  if (!noticeElement) return;
  noticeElement.textContent = message;
  noticeElement.className = `notice show ${isError ? "error" : "success"}`;

  clearTimeout(window.noticeTimeoutId);
  window.noticeTimeoutId = setTimeout(() => {
    noticeElement.className = "notice";
  }, 4500);
}

// Mark single requirement complete
async function markLearningItemComplete(button) {
  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = "Saving...";

  try {
    await requestJson("/api/employee/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requirement_id: button.dataset.requirementId, score: 100 }),
    });
    showNotice("Progress saved! This learning item is now complete.");
    await loadEmployeePortal();
  } catch (error) {
    showNotice(error.message, true);
    button.disabled = false;
    button.textContent = originalLabel;
  }
}

// Render Header and Hero Profile
function renderProfile(portalData) {
  const emp = portalData.employee || {};
  const name = emp.name || "Team Member";
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "EP";

  getElement("#avatarInitials").textContent = initials;
  getElement("#headerUserName").textContent = name;
  getElement("#headerUserRole").textContent = emp.role || "Employee";
  getElement("#welcomeGreeting").textContent = `Welcome back, ${name}! 👋`;

  getElement("#heroRolePill").textContent = `Role: ${emp.role || "Not specified"}`;
  getElement("#heroDeptPill").textContent = `Dept: ${emp.department || "Corporate"}`;
  getElement("#heroExpPill").textContent = `Experience: ${emp.experience || "Beginner"}`;
  getElement("#heroManagerPill").textContent = `Manager: ${emp.manager || "Manager One"}`;
}

// Render Quick Metrics and Progress Fill
function renderMetricsAndProgress(portalData) {
  const completed = portalData.completed || 0;
  const total = portalData.total || 0;
  const pending = Math.max(0, total - completed);
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const coverage = portalData.plan?.validation?.coverage_score ?? 100;

  getElement("#progressPercent").textContent = `${percent}%`;
  getElement("#progressSummary").textContent = `${completed} of ${total} Completed`;
  getElement("#progressFill").style.width = `${percent}%`;

  getElement("#metricCompleted").textContent = completed;
  getElement("#metricTotal").textContent = total;
  getElement("#metricPending").textContent = pending;
  getElement("#metricCoverage").textContent = `${coverage}%`;
}

// Render Assigned Learning Plan
function renderAssignedPlan(portalData) {
  const planContainer = getElement("#learningItemsList");
  const planSubtext = getElement("#planSubtext");
  const planStatusTag = getElement("#planStatusTag");

  if (!portalData.plan || !portalData.plan.items || !portalData.plan.items.length) {
    planStatusTag.textContent = "Draft Pending";
    planStatusTag.className = "badge optional";
    planSubtext.textContent = "Your customized onboarding plan is being prepared or reviewed by HR. You will see your modules here as soon as they are approved.";
    planContainer.innerHTML = `
      <div style="text-align:center; padding:32px 16px; background:#f8fafc; border-radius:10px; border:1px dashed #cbd5e1;">
        <p style="margin:0; color:#64748b; font-size:14px; font-weight:600;">No active onboarding modules assigned yet.</p>
        <small style="color:#94a3b8; display:block; margin-top:4px;">Check upcoming events below or reach out to your reporting manager.</small>
      </div>
    `;
    return;
  }

  planStatusTag.textContent = `${portalData.plan.status} · Assigned ${portalData.plan.created_at}`;
  planStatusTag.className = "badge stage";

  const completedSet = new Set(portalData.completed_ids || []);

  planContainer.innerHTML = portalData.plan.items.map((item, index) => {
    const isCompleted = completedSet.has(item.requirement_id);
    const buttonLabel = isCompleted ? "Completed ✓" : "Mark as Complete";

    const quiz = item.quiz || {};
    const options = Array.isArray(quiz.options) ? quiz.options : [];
    let quizHtml = "";

    if (options.length) {
      quizHtml = `
        <details class="quiz-box">
          <summary>🧠 Knowledge Check: ${escapeHtml(quiz.question || "Quick review question")}</summary>
          <div class="quiz-content">
            <label style="display:block; font-size:12.5px; margin-bottom:4px; font-weight:600; color:#475569;">Select the best action:</label>
            <select class="quiz-answer-select" data-requirement-id="${item.requirement_id}">
              ${options.map((opt) => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join("")}
            </select>
            <button class="quiz-submit-btn" data-plan-id="${portalData.plan.id}" data-requirement-id="${item.requirement_id}" data-answer="${escapeHtml(quiz.answer || "")}">
              Submit Quiz Answer
            </button>
          </div>
        </details>
      `;
    }

    const checklist = Array.isArray(item.checklist) ? item.checklist : [];
    let checklistHtml = checklist.length
      ? `<div style="margin:8px 0; font-size:12.5px; color:#475569;">
          <b>Checklist:</b>
          <ul style="margin:4px 0 0 16px; padding:0;">
            ${checklist.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}
          </ul>
        </div>`
      : "";

    return `
      <article class="learning-item ${isCompleted ? "completed" : ""}">
        <div class="learning-header">
          <div style="flex:1;">
            <div class="learning-tags">
              <span class="badge stage">${escapeHtml(item.due_stage || "Week 1")}</span>
              <span class="badge ${item.mandatory === "Mandatory" ? "mandatory" : "optional"}">${escapeHtml(item.mandatory || "Mandatory")}</span>
              <span class="badge source" title="Source Document">📄 ${escapeHtml(item.source_document_id)} § ${escapeHtml(item.source_section_id)}</span>
            </div>
            <h3 class="learning-title" style="margin-top:8px;">${index + 1}. ${escapeHtml(item.module || item.role)}</h3>
            <p class="learning-objective">${escapeHtml(item.objective)}</p>
            ${item.task ? `<p style="font-size:13px; color:#0e7490; margin:0 0 6px;"><b>Task:</b> ${escapeHtml(item.task)}</p>` : ""}
            ${checklistHtml}
            ${quizHtml}
          </div>
          <button class="complete-btn" data-requirement-id="${item.requirement_id}" ${isCompleted ? "disabled" : ""}>
            ${buttonLabel}
          </button>
        </div>
      </article>
    `;
  }).join("");

  document.querySelectorAll(".complete-btn:not([disabled])").forEach((btn) => {
    btn.onclick = () => markLearningItemComplete(btn);
  });

  document.querySelectorAll(".quiz-submit-btn").forEach((btn) => {
    btn.onclick = async () => {
      const select = getElement(`.quiz-answer-select[data-requirement-id="${btn.dataset.requirementId}"]`);
      const selectedValue = select?.value;
      const correctAnswer = btn.dataset.answer;
      const isPassed = selectedValue === correctAnswer;

      btn.disabled = true;
      btn.textContent = "Checking...";

      try {
        await requestJson("/api/learning-attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan_id: btn.dataset.planId,
            requirement_id: btn.dataset.requirementId,
            activity_type: "Knowledge Check Quiz",
            score: isPassed ? 100 : 0,
            feedback: isPassed ? "Correct answer selected!" : "Incorrect option. Review the cited policy and try again.",
          }),
        });

        if (isPassed) {
          showNotice("🎉 Correct! Your score was recorded and the module was completed.");
          await loadEmployeePortal();
        } else {
          showNotice("Not quite. Review the cited policy section and try again.", true);
          btn.disabled = false;
          btn.textContent = "Try Again";
        }
      } catch (err) {
        showNotice(err.message, true);
        btn.disabled = false;
        btn.textContent = "Submit Quiz Answer";
      }
    };
  });
}

// Render Events & Announcements
function renderEngagement(portalData) {
  const eventsContainer = getElement("#employeeEventsList");
  const announcementsContainer = getElement("#employeeAnnouncementsList");

  if (eventsContainer) {
    eventsContainer.innerHTML = portalData.events?.length
      ? portalData.events.map((evt) => {
          let month = "SEP";
          let day = "01";
          if (evt.event_date) {
            const parts = evt.event_date.split("-");
            if (parts.length === 3) {
              const d = new Date(evt.event_date);
              month = d.toLocaleString("default", { month: "short" }).toUpperCase();
              day = parts[2];
            }
          }
          return `
            <div class="event-card-item">
              <div class="event-date-box">
                <span class="month">${month}</span>
                <span class="day">${day}</span>
              </div>
              <div class="event-info">
                <b>${escapeHtml(evt.title)}</b>
                <p>⏰ ${escapeHtml(evt.event_time)} · 📍 ${escapeHtml(evt.location || "Online")}</p>
                <small>${escapeHtml(evt.description || "Audience: " + (evt.audience || "All Employees"))}</small>
              </div>
            </div>
          `;
        }).join("")
      : '<p class="hint-text">No upcoming events right now.</p>';
  }

  if (announcementsContainer) {
    announcementsContainer.innerHTML = portalData.announcements?.length
      ? portalData.announcements.map((ann) => `
          <div class="announcement-item">
            <b>📢 ${escapeHtml(ann.title)}</b>
            <p>${escapeHtml(ann.message)}</p>
            <small style="color:#94a3b8; font-size:11.5px;">Posted by ${escapeHtml(ann.created_by || "HR")} · ${escapeHtml(ann.created_at || "")}</small>
          </div>
        `).join("")
      : '<p class="hint-text">No company notices right now.</p>';
  }
}

// Render Leave Requests History
function renderLeaveRequests(portalData) {
  const container = getElement("#leaveRequestsList");
  if (!container) return;

  container.innerHTML = portalData.leave_requests?.length
    ? portalData.leave_requests.map((leave) => `
        <div class="leave-item">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <b>${escapeHtml(leave.leave_type)}</b>
            <span class="leave-status ${escapeHtml(leave.status)}">${escapeHtml(leave.status)}</span>
          </div>
          <p style="margin:2px 0 4px; font-size:12.5px; color:#475569;">${escapeHtml(leave.start_date)} to ${escapeHtml(leave.end_date)}</p>
          <small style="color:#64748b; font-size:12px;">Reason: ${escapeHtml(leave.reason)}</small>
          ${leave.reviewer_comment ? `<div style="margin-top:4px; font-size:12px; color:#0e7490; background:#f0f9ff; padding:4px 8px; border-radius:4px;"><b>HR note:</b> ${escapeHtml(leave.reviewer_comment)}</div>` : ""}
        </div>
      `).join("")
    : '<p class="hint-text">You have not submitted any leave requests yet.</p>';
}

// Render Submissions History
function renderSubmissions(portalData) {
  const container = getElement("#submissionsList");
  if (!container) return;

  container.innerHTML = portalData.submissions?.length
    ? portalData.submissions.map((sub) => `
        <div class="submission-item">
          <b>${escapeHtml(sub.title)}</b>
          <small>Version ${escapeHtml(sub.version)} · Status: <b>${escapeHtml(sub.status)}</b> ${sub.injection_flag ? '· <span style="color:#e11d48;">Security review</span>' : ""}</small>
        </div>
      `).join("")
    : '<p class="hint-text">No files submitted yet.</p>';
}

// AI Adaptive Recommendations
async function loadRecommendations() {
  const btn = getElement("#getRecommendationsBtn");
  btn.disabled = true;
  btn.textContent = "Calculating next steps...";

  try {
    const portalData = await requestJson("/api/employee/dashboard");
    if (!portalData.employee) throw new Error("Employee profile is not loaded.");

    const res = await requestJson(`/api/employees/${portalData.employee.id}/recommendations`);
    const container = getElement("#recommendationsList");

    container.innerHTML = res.recommendations?.length
      ? res.recommendations.map((rec) => `
          <div class="recommendation-card">
            <b>🎯 ${escapeHtml((rec.action || "Recommended Action").replaceAll("_", " "))}</b>
            <p>${escapeHtml(rec.reason)}</p>
            <small>Priority: <b>${escapeHtml(rec.priority || "Medium")}</b> · Source: <code>${escapeHtml(rec.source_document_id || "Company Policy")}</code></small>
          </div>
        `).join("")
      : '<p class="hint-text">You are right on track! No urgent actions needed.</p>';

    showNotice(res.generation.fallback ? "Recommendations calculated from validated rule engine." : `Recommendations generated with ${res.generation.provider}.`);
  } catch (err) {
    showNotice(err.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = "Get Personalized Next Steps";
  }
}

// Master Portal Loader
async function loadEmployeePortal() {
  try {
    const portalData = await requestJson("/api/employee/dashboard");
    renderProfile(portalData);
    renderMetricsAndProgress(portalData);
    renderAssignedPlan(portalData);
    renderEngagement(portalData);
    renderLeaveRequests(portalData);
    renderSubmissions(portalData);
  } catch (error) {
    showNotice(error.message || "Unable to load portal data.", true);
  }
}

// Event Listeners
getElement("#submitDocForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitBtn = getElement("#submitDocBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  try {
    const res = await requestJson("/api/employee/documents/submit", {
      method: "POST",
      body: new FormData(event.target),
    });
    showNotice(res.message + (res.injection_flag ? " [Security Scan Flagged]" : ""));
    event.target.reset();
    await loadEmployeePortal();
  } catch (error) {
    showNotice(error.message, true);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit for HR Review";
  }
});

getElement("#leaveRequestForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const sendBtn = getElement("#sendLeaveBtn");
  sendBtn.disabled = true;
  sendBtn.textContent = "Sending...";

  try {
    const data = Object.fromEntries(new FormData(event.target));
    const res = await requestJson("/api/employee/leave-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    showNotice(res.message);
    event.target.reset();
    await loadEmployeePortal();
  } catch (error) {
    showNotice(error.message, true);
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = "Submit Leave Request";
  }
});

getElement("#logoutBtn")?.addEventListener("click", async () => {
  await requestJson("/api/auth/logout", { method: "POST" });
  window.location = "/";
});

getElement("#getRecommendationsBtn")?.addEventListener("click", loadRecommendations);

loadEmployeePortal();
