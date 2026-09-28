// For the logged in User/Employee data

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

async function requestJson(url, options) {
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
  noticeElement.textContent = message;
  noticeElement.className = `notice show${isError ? " error" : ""}`;

  clearTimeout(window.noticeTimeoutId);
  window.noticeTimeoutId = setTimeout(() => {
    noticeElement.className = "notice";
  }, 4500);
}

async function markLearningItemComplete(button) {
  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = "Saving...";

  try {
    await requestJson("/api/employee/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requirement_id: button.dataset.requirementId }),
    });
    showNotice("Progress saved. This learning item is now complete.");
    await loadEmployeePortal();
  } catch (error) {
    showNotice(error.message, true);
    button.disabled = false;
    button.textContent = originalLabel;
  }
}

function renderEmployeeSubmissions(submittedDocuments) {
  getElement("#submissions").innerHTML = submittedDocuments.length
    ? submittedDocuments
        .map(
          (documentRecord) => `<p class="submission">
            <b>${escapeHtml(documentRecord.title)}</b><br>
            <small>v${escapeHtml(documentRecord.version)} - ${escapeHtml(documentRecord.status)}${documentRecord.injection_flag ? " - Security review required" : ""}</small>
          </p>`,
        )
        .join("")
    : '<p class="hint">No documents submitted yet.</p>';
}

function renderProgressCards(portalData) {
  const verificationCard = portalData.plan
    ? `<div><b>${portalData.plan.validation.coverage_score}%</b><small>coverage verified</small></div>`
    : "";

  getElement("#progress").innerHTML = `
    <div><b>${portalData.completed}</b><small>completed</small></div>
    <div><b>${portalData.total}</b><small>assigned items</small></div>
    ${verificationCard}`;
}

function renderEngagement(portalData) {
  getElement("#employeeEvents").innerHTML = portalData.events?.length ? portalData.events.map((event) => `<div class="engagement-item"><b>${escapeHtml(event.title)}</b><p>${escapeHtml(event.event_date)} at ${escapeHtml(event.event_time)} - ${escapeHtml(event.location)}</p><small>${escapeHtml(event.description || "No additional instructions.")}</small></div>`).join("") : '<p class="hint">No upcoming events for you right now.</p>';
  getElement("#employeeAnnouncements").innerHTML = portalData.announcements?.length ? portalData.announcements.map((announcement) => `<div class="engagement-item"><b>${escapeHtml(announcement.title)}</b><p>${escapeHtml(announcement.message)}</p></div>`).join("") : '<p class="hint">No notices right now.</p>';
}

function renderLeaveRequests(portalData) {
  getElement("#leaveRequests").innerHTML = portalData.leave_requests?.length ? portalData.leave_requests.map((leave) => `<div class="engagement-item"><b>${escapeHtml(leave.leave_type)}</b><p>${escapeHtml(leave.start_date)} to ${escapeHtml(leave.end_date)}</p><small>${escapeHtml(leave.reason)}</small><br><span class="leave-status ${escapeHtml(leave.status)}">${escapeHtml(leave.status)}</span>${leave.reviewer_comment ? `<small> HR note: ${escapeHtml(leave.reviewer_comment)}</small>` : ""}</div>`).join("") : '<p class="hint">You have not requested any leave yet.</p>';
}

function renderAssignedPlan(portalData) {
  if (!portalData.plan) {
    getElement("#status").textContent =
      "Your manager has not assigned an onboarding plan yet.";
    getElement("#items").innerHTML = "";
    return;
  }

  const completedRequirementIds = new Set(portalData.completed_ids || []);
  getElement("#status").textContent =
    `${portalData.plan.status} - Assigned ${portalData.plan.created_at}`;
  getElement("#items").innerHTML = portalData.plan.items
    .map((learningItem) => {
      const isComplete = completedRequirementIds.has(
        learningItem.requirement_id,
      );
      const buttonLabel = isComplete ? "Completed" : "Mark complete";
      return `<div class="learning ${isComplete ? "completed" : ""}">
        <div>
          <b>${escapeHtml(learningItem.module)}</b>
          <p>${escapeHtml(learningItem.objective)}</p>
          <small>${learningItem.due_stage} - ${learningItem.mandatory} - Source: ${learningItem.source_document_id} ${learningItem.source_section_id}</small>
        </div>
        <button class="complete" data-requirement-id="${learningItem.requirement_id}" ${isComplete ? "disabled" : ""}>${buttonLabel}</button>
      </div>`;
    })
    .join("");

  document.querySelectorAll(".complete:not([disabled])").forEach((button) => {
    button.onclick = () => markLearningItemComplete(button);
  });
}

async function loadEmployeePortal() {
  try {
    const portalData = await requestJson("/api/employee/dashboard");
    getElement("#welcome").textContent = `Welcome, ${portalData.employee.name}`;
    getElement("#role").textContent =
      `${portalData.employee.role} - ${portalData.employee.department}`;

    renderProgressCards(portalData);
    renderEngagement(portalData);
    renderLeaveRequests(portalData);
    renderEmployeeSubmissions(portalData.submissions || []);
    renderAssignedPlan(portalData);
  } catch (error) {
    showNotice(error.message || "Unable to load your portal.", true);
  }
}

getElement("#submitDoc").onsubmit = async (event) => {
  event.preventDefault();
  const submitButton = event.target.querySelector("button");
  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";

  try {
    const submissionResult = await requestJson(
      "/api/employee/documents/submit",
      {
        method: "POST",
        body: new FormData(event.target),
      },
    );
    const securityMessage = submissionResult.injection_flag
      ? " Security flag recorded."
      : "";
    showNotice(submissionResult.message + securityMessage);
    event.target.reset();
    await loadEmployeePortal();
  } catch (error) {
    showNotice(error.message, true);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Send to HR for review";
  }
};

getElement("#leaveForm").onsubmit = async (event) => {
  event.preventDefault();
  const button = event.target.querySelector("button");
  button.disabled = true;
  try {
    const result = await requestJson("/api/employee/leave-requests", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(event.target)))});
    showNotice(result.message);
    event.target.reset();
    await loadEmployeePortal();
  } catch (error) { showNotice(error.message, true); } finally { button.disabled = false; }
};

getElement("#logout").onclick = async () => {
  await requestJson("/api/auth/logout", { method: "POST" });
  window.location = "/";
};

loadEmployeePortal();
