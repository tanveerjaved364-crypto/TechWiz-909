// This file only works with the logged-in employee's own data.

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
    submitButton.textContent = "Submit for review";
  }
};

getElement("#logout").onclick = async () => {
  await requestJson("/api/auth/logout", { method: "POST" });
  window.location = "/";
};

loadEmployeePortal();
