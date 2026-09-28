// This file controls the Admin / Manager / Reviewer CRM workspace.
// Keep API calls here. The server remains responsible for real authorization.

const appState = {
  currentUser: null,
  employees: [],
  documents: [],
  requirements: [],
  onboardingPlans: [],
  events: [],
  announcements: [],
  leaveRequests: [],
};

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
  const controller = new AbortController();
  const requestTimeout = setTimeout(() => controller.abort(), options?.timeoutMs || 75000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const responseData = await response.json();
    if (!response.ok) {
      const requestError = new Error(responseData.error || "The request could not be completed.");
      requestError.statusCode = response.status;
      throw requestError;
    }
    return responseData;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Generation took too long. The plan was not saved; try again or select another free model.");
    }
    throw error;
  } finally {
    clearTimeout(requestTimeout);
  }
}

function showToast(message, type = "success") {
  const toastElement = getElement("#toast");
  toastElement.textContent = message;
  toastElement.className = `toast show ${type}`;

  clearTimeout(window.toastTimeoutId);
  window.toastTimeoutId = setTimeout(() => {
    toastElement.className = "toast";
  }, 4500);
}

function switchWorkspaceView(viewName) {
  document.querySelectorAll(".nav, .view").forEach((element) => {
    element.classList.remove("active");
  });

  const navigationButton = getElement(`[data-view="${viewName}"]`);
  navigationButton?.classList.add("active");
  getElement(`#${viewName}`).classList.add("active");
  getElement("#title").textContent =
    navigationButton?.textContent || "Welcome to SkillSprint";
}

// Draws a small dependency-free bar chart for the CRM dashboard.
function drawBarChart(canvasSelector, chartRows) {
  const chartCanvas = getElement(canvasSelector);
  const drawingContext = chartCanvas.getContext("2d");
  const deviceScale = window.devicePixelRatio || 1;
  const chartWidth = chartCanvas.clientWidth;
  const chartHeight = chartCanvas.clientHeight;

  chartCanvas.width = chartWidth * deviceScale;
  chartCanvas.height = chartHeight * deviceScale;
  drawingContext.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);
  drawingContext.clearRect(0, 0, chartWidth, chartHeight);

  const maximumValue = Math.max(
    ...chartRows.map((row) => row.count ?? row.completed),
    1,
  );
  const gapSize = 14;
  const barWidth = Math.max(
    22,
    (chartWidth - gapSize * (chartRows.length + 1)) /
      Math.max(chartRows.length, 1),
  );

  chartRows.forEach((chartRow, index) => {
    const value = chartRow.count ?? chartRow.completed;
    const barHeight = ((chartHeight - 54) * value) / maximumValue;
    const leftPosition = gapSize + index * (barWidth + gapSize);

    drawingContext.fillStyle =
      index % 2 ? "hsla(162, 88%, 35%, 1)" : "hsla(199, 67%, 31%, 1)";
    drawingContext.fillRect(
      leftPosition,
      chartHeight - 30 - barHeight,
      barWidth,
      barHeight,
    );
    drawingContext.fillStyle = "hsla(208, 18%, 38%, 1)";
    drawingContext.font = "12px Arial";
    drawingContext.textAlign = "center";
    drawingContext.fillText(
      String(value),
      leftPosition + barWidth / 2,
      chartHeight - 36 - barHeight,
    );
    drawingContext.fillText(
      (chartRow.status || chartRow.role).slice(0, 13),
      leftPosition + barWidth / 2,
      chartHeight - 10,
    );
  });
}

function renderEmployeeTable() {
  const searchText = getElement("#employeeSearch").value.toLowerCase();
  const canGeneratePlans = ["admin", "manager"].includes(
    appState.currentUser.role,
  );
  const matchingEmployees = appState.employees.filter((employee) =>
    `${employee.name} ${employee.role}`.toLowerCase().includes(searchText),
  );

  getElement("#employeeRows").innerHTML = matchingEmployees
    .map((employee) => {
      const action = canGeneratePlans
        ? `<button class="generate-plan-button" data-employee-id="${employee.id}">Generate plan</button>`
        : "Read only";

      return `<tr>
        <td><b>${escapeHtml(employee.name)}</b><small>${employee.id}</small></td>
        <td>${escapeHtml(employee.role)}</td>
        <td>${escapeHtml(employee.department)}</td>
        <td>${escapeHtml(employee.experience)}</td>
        <td id="plan-status-${employee.id}">No plan</td>
        <td>${action}</td>
      </tr>`;
    })
    .join("");

  document.querySelectorAll(".generate-plan-button").forEach((button) => {
    button.onclick = () => generateOnboardingPlan(button);
  });
}

function renderDocumentRegister() {
  const searchText = getElement("#docSearch").value.toLowerCase();
  const canApproveDocuments = ["admin", "reviewer"].includes(
    appState.currentUser.role,
  );
  const matchingDocuments = appState.documents.filter((documentRecord) =>
    `${documentRecord.title} ${documentRecord.id}`
      .toLowerCase()
      .includes(searchText),
  );

  getElement("#docs").innerHTML = matchingDocuments.length
    ? matchingDocuments
        .map((documentRecord) => {
          let statusAction = "";
          if (documentRecord.injection_flag) {
            statusAction = '<span class="danger">Security flag</span>';
          } else if (
            documentRecord.status === "Pending Review" &&
            canApproveDocuments
          ) {
            statusAction = `<button class="approve-document-button" data-document-id="${documentRecord.id}">Approve</button>`;
          }

          return `<div class="record">
            <div><b>${escapeHtml(documentRecord.title)}</b><small>${documentRecord.id} - v${escapeHtml(documentRecord.version)} - ${documentRecord.status}</small></div>
            ${statusAction}
          </div>`;
        })
        .join("")
    : '<p class="sub">No matching documents.</p>';

  document.querySelectorAll(".approve-document-button").forEach((button) => {
    button.onclick = () => approveDocument(button);
  });
}

function renderRequirementMatrix() {
  const searchText = getElement("#matrixSearch").value.toLowerCase();
  const matchingRequirements = appState.requirements.filter((requirement) =>
    `${requirement.id} ${requirement.role} ${requirement.description} ${requirement.document_id}`
      .toLowerCase()
      .includes(searchText),
  );

  getElement("#matrixCount").textContent =
    `${matchingRequirements.length} records`;
  getElement("#matrixRows").innerHTML = matchingRequirements
    .slice(0, 100)
    .map(
      (requirement) => `<tr>
        <td>${requirement.id}</td>
        <td>${escapeHtml(requirement.role)}</td>
        <td>${escapeHtml(requirement.description)}</td>
        <td>${requirement.mandatory}</td>
        <td>${requirement.document_id} ${requirement.section_ref}</td>
        <td>${requirement.due_stage}</td>
      </tr>`,
    )
    .join("");
}

function renderPlanRegister() {
  appState.onboardingPlans.forEach((plan) => {
    const statusCell = getElement(`#plan-status-${plan.employee_id}`);
    if (statusCell) {
      statusCell.innerHTML = `<span class="tag ${plan.status === "Verified" ? "ok" : "warn"}">${plan.status}</span>`;
    }
  });

  getElement("#plansList").innerHTML = appState.onboardingPlans.length
    ? appState.onboardingPlans
        .map((plan) => {
          const validationReport = JSON.parse(plan.report_json);
          return `<div class="record">
            <div><b>${plan.employee_id} - ${escapeHtml(plan.role)}</b><small>${plan.created_at} - ${escapeHtml(plan.generation_mode || "legacy plan")} - coverage ${validationReport.coverage_score}% - traceability ${validationReport.traceability_score}%</small></div>
            <div><span class="tag ${plan.status === "Verified" ? "ok" : "warn"}">${plan.status}</span><button class="open-plan-button" data-plan-id="${plan.id}">Open plan</button></div>
          </div>`;
        })
        .join("")
    : '<p class="sub">No onboarding plans generated yet.</p>';

  document.querySelectorAll(".open-plan-button").forEach((button) => {
    button.onclick = () => openPlanDetail(button.dataset.planId);
  });
}

function renderEngagement() {
  const audiences = ["All Employees", ...new Set(appState.employees.flatMap((employee) => [employee.department, employee.role]))];
  ["#eventAudience", "#noticeAudience"].forEach((selector) => {
    getElement(selector).innerHTML = audiences.map((audience) => `<option>${escapeHtml(audience)}</option>`).join("");
  });
  getElement("#eventsList").innerHTML = appState.events.length ? appState.events.map((event) => `<div class="record"><div><b>${escapeHtml(event.title)}</b><small>${escapeHtml(event.event_date)} at ${escapeHtml(event.event_time)} - ${escapeHtml(event.location)} - for ${escapeHtml(event.audience)}</small><small>${escapeHtml(event.description || "No additional instructions.")}</small></div><span class="event-date">Event</span></div>`).join("") : '<p class="sub">No events have been added yet.</p>';
  getElement("#announcementsList").innerHTML = appState.announcements.length ? appState.announcements.map((announcement) => `<div class="record"><div><b>${escapeHtml(announcement.title)}</b><small>For ${escapeHtml(announcement.audience)} - ${escapeHtml(announcement.created_at)}</small><small>${escapeHtml(announcement.message)}</small></div></div>`).join("") : '<p class="sub">No notices have been published yet.</p>';
  getElement("#leaveRequestsList").innerHTML = appState.leaveRequests.length ? appState.leaveRequests.map((leave) => `<div class="record"><div><b>${escapeHtml(leave.name)} - ${escapeHtml(leave.leave_type)}</b><small>${escapeHtml(leave.start_date)} to ${escapeHtml(leave.end_date)} - ${escapeHtml(leave.reason)}</small><small>Status: ${escapeHtml(leave.status)}</small></div>${leave.status === "Pending" && ["admin", "manager"].includes(appState.currentUser.role) ? `<div><button class="leave-review" data-id="${leave.id}" data-status="Approved">Approve</button><button class="leave-decline leave-review" data-id="${leave.id}" data-status="Declined">Decline</button></div>` : `<span class="tag ${leave.status === "Approved" ? "ok" : "warn"}">${escapeHtml(leave.status)}</span>`}</div>`).join("") : '<p class="sub">No leave requests yet.</p>';
  document.querySelectorAll(".leave-review").forEach((button) => button.onclick = async () => { try { const result = await requestJson(`/api/leave-requests/${button.dataset.id}/review`, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:button.dataset.status})}); showToast(result.message); await loadWorkspaceData(); } catch(error) { showToast(error.message,"error"); }});
}

async function approveDocument(button) {
  button.disabled = true;
  try {
    const result = await requestJson(
      `/api/documents/${button.dataset.documentId}/approve`,
      {
        method: "POST",
      },
    );
    showToast(
      `${result.message} ${result.requirements_added} requirements added.`,
    );
    await loadWorkspaceData();
  } catch (error) {
    showToast(error.message, "error");
    button.disabled = false;
  }
}

async function generateOnboardingPlan(button) {
  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = "Generating...";

  try {
    const generatedPlan = await requestJson(
      `/api/generate/${button.dataset.employeeId}`,
      {
        method: "POST",
      },
    );
    showToast(
      `Plan generated and ${generatedPlan.validation.status.toLowerCase()}.`,
    );
    await loadWorkspaceData();
    switchWorkspaceView("plans");
    await openPlanDetail(generatedPlan.id);
  } catch (error) {
    try {
      button.textContent = "Creating fallback plan...";
      const fallbackPlan = await requestJson(`/api/generate/${button.dataset.employeeId}?fallback=1`, { method: "POST", timeoutMs: 15000 });
      showToast(`Live GenAI was unavailable. A validated fallback plan was created (${fallbackPlan.validation.status}).`, "error");
      await loadWorkspaceData();
      switchWorkspaceView("plans");
      await openPlanDetail(fallbackPlan.id);
    } catch (fallbackError) {
      showToast(`Live generation failed: ${error.message}. Fallback also failed: ${fallbackError.message}`, "error");
    }
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
}

async function openPlanDetail(planId) {
  try {
    const planDetail = await requestJson(`/api/plans/${planId}`);
    const detailPanel = getElement("#planDetail");
    const planItemsByStage = planDetail.plan.stages;

    detailPanel.classList.remove("hidden");
    detailPanel.innerHTML = `<div class="detail-head">
      <div>
        <p class="eyebrow">${escapeHtml(planDetail.employee_id)} - ${escapeHtml(planDetail.role)}</p>
        <h2>${planDetail.status}</h2>
        <p class="sub">Generated ${planDetail.created_at}. ${escapeHtml(planDetail.generation_mode || "legacy plan")}. Python validation independently checked ${planDetail.validation.checked_requirements} requirements.</p>
      </div>
      <div class="score-grid">
        <span><b>${planDetail.validation.coverage_score}%</b>Mandatory coverage</span>
        <span><b>${planDetail.validation.traceability_score}%</b>Traceability</span>
        <span><b>${planDetail.validation.consistency_score}%</b>Consistency</span>
      </div>
    </div>
    <div class="review-actions"><b>Review: ${escapeHtml(planDetail.review_status || "Pending Review")}</b><button class="plan-review" data-plan-id="${planDetail.id}" data-decision="Approved">Approve plan</button><button class="plan-review" data-plan-id="${planDetail.id}" data-decision="Needs Changes">Request changes</button></div>
    ${renderValidationIssues(planDetail.validation.issues)}
    <div class="stage-grid">${planItemsByStage.map(renderPlanStage).join("")}</div>`;
    document.querySelectorAll(".plan-review").forEach((button) => button.onclick = async () => {
      try { const result = await requestJson(`/api/plans/${button.dataset.planId}/review`, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({decision:button.dataset.decision})}); showToast(result.message); await loadWorkspaceData(); await openPlanDetail(button.dataset.planId); } catch (error) { showToast(error.message, "error"); }
    });
    detailPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    showToast(error.message, "error");
  }
}

function renderValidationIssues(validationIssues) {
  if (!validationIssues.length) {
    return '<div class="success">All required items are source-grounded and verified.</div>';
  }

  return `<div class="issues"><b>Validation issues</b>${validationIssues
    .map(
      (issue) =>
        `<p>${escapeHtml(issue.type)}: ${escapeHtml(issue.detail)}</p>`,
    )
    .join("")}</div>`;
}

function renderPlanStage(stage) {
  const stageContent = stage.items.length
    ? stage.items.map(renderLearningModule).join("")
    : '<p class="sub">No items in this stage.</p>';

  return `<section class="stage"><h3>${escapeHtml(stage.name)} <small>${stage.items.length} items</small></h3>${stageContent}</section>`;
}

function renderLearningModule(module) {
  const rubric = module.rubric[0];
  return `<article class="module">
    <b>${escapeHtml(module.module)}</b>
    <p>${escapeHtml(module.objective)}</p>
    <small>${module.mandatory} - ${module.priority} - Source: ${module.source_document_id} ${module.source_section_id}</small>
    <details>
      <summary>Task, quiz and rubric</summary>
      <p><b>Task:</b> ${escapeHtml(module.task)}</p>
      <p><b>Quiz:</b> ${escapeHtml(module.quiz.question)} <em>Answer: ${escapeHtml(module.quiz.answer)}</em></p>
      <p><b>Assessment:</b> ${escapeHtml(rubric.criterion)} - pass: ${escapeHtml(rubric.pass_condition)}</p>
    </details>
  </article>`;
}

async function loadWorkspaceData() {
  try {
    const endpoints = [
      "/api/auth/me",
      "/api/dashboard",
      "/api/analytics",
      "/api/employees",
      "/api/documents",
      "/api/requirements",
      "/api/plans",
      "/api/events",
      "/api/announcements",
      "/api/leave-requests",
    ];
    const [
      currentUser,
      dashboardMetrics,
      analytics,
      employees,
      documents,
      requirements,
      plans,
      events,
      announcements,
      leaveRequests,
      // Do not write endpoints.map(requestJson). Array.map would then pass the
      // item index as requestJson's second parameter, which breaks fetch options.
    ] = await Promise.all(endpoints.map((endpoint) => requestJson(endpoint)));

    Object.assign(appState, {
      currentUser,
      employees,
      documents,
      requirements,
      onboardingPlans: plans,
      events,
      announcements,
      leaveRequests,
    });
    getElement("#identity").textContent =
      `${currentUser.role.toUpperCase()} WORKSPACE - ${currentUser.username}`;
    renderDashboardMetrics(dashboardMetrics, analytics);
    populateRoleSelector(employees);
    renderEmployeeTable();
    renderDocumentRegister();
    renderRequirementMatrix();
    renderPlanRegister();
    renderEngagement();
    applyReadOnlyPermissions(currentUser.role);
  } catch (error) {
    // Redirect only after a genuine expired-login response. Other API errors
    // must remain visible instead of creating an endless redirect loop.
    if (error.statusCode === 401) {
      window.location = "/";
    } else {
      showToast(`Dashboard could not load: ${error.message}`, "error");
    }
  }
}

function renderDashboardMetrics(metrics, analytics) {
  const metricValues = [
    ["Employees", metrics.employees],
    ["Active sources", metrics.active_documents],
    ["Requirement matrix", metrics.requirements],
    ["Plans", metrics.plans],
    ["Review flags", analytics.flagged.length],
  ];
  getElement("#metrics").innerHTML = metricValues
    .map(
      ([label, value]) =>
        `<div class="metric"><span>${label}</span><b>${value}</b></div>`,
    )
    .join("");

  drawBarChart("#planChart", analytics.plan_status);
  drawBarChart("#docChart", analytics.document_status);
  getElement("#queue").innerHTML = analytics.flagged.length
    ? analytics.flagged
        .map(
          (documentRecord) =>
            `<div class="record"><div><b>${escapeHtml(documentRecord.title)}</b><small>${documentRecord.id} - ${documentRecord.status}</small></div><span class="tag warn">Needs attention</span></div>`,
        )
        .join("")
    : "No documents need attention.";
}

function populateRoleSelector(employees) {
  const roles = [
    "All Employees",
    ...new Set(employees.map((employee) => employee.role)),
  ];
  getElement("#uploadRole").innerHTML = roles
    .map((role) => `<option>${role}</option>`)
    .join("");
}

function applyReadOnlyPermissions(userRole) {
  if (!["admin", "reviewer"].includes(userRole)) {
    getElement("#upload").closest(".panel").innerHTML =
      '<h2>Source documents</h2><p class="sub">You have read-only access to the document register.</p>';
  }
}

document.querySelectorAll(".nav").forEach((button) => {
  button.onclick = () => switchWorkspaceView(button.dataset.view);
});
document.querySelectorAll(".go-to-view").forEach((button) => {
  button.onclick = () => switchWorkspaceView(button.dataset.goTo);
});
getElement("#employeeSearch").oninput = renderEmployeeTable;
getElement("#docSearch").oninput = renderDocumentRegister;
getElement("#matrixSearch").oninput = renderRequirementMatrix;
getElement("#refreshEmployees").onclick = loadWorkspaceData;

getElement("#upload").onsubmit = async (event) => {
  event.preventDefault();
  const submitButton = event.target.querySelector("button");
  submitButton.disabled = true;
  try {
    const uploadResult = await requestJson("/api/documents/upload", {
      method: "POST",
      body: new FormData(event.target),
    });
    showToast(uploadResult.message);
    event.target.reset();
    await loadWorkspaceData();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    submitButton.disabled = false;
  }
};

async function submitEngagementForm(event, endpoint) {
  event.preventDefault();
  const button = event.target.querySelector("button");
  button.disabled = true;
  try {
    const body = Object.fromEntries(new FormData(event.target));
    const response = await requestJson(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    showToast(response.message);
    event.target.reset();
    await loadWorkspaceData();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    button.disabled = false;
  }
}

getElement("#eventForm").onsubmit = (event) => submitEngagementForm(event, "/api/events");
getElement("#announcementForm").onsubmit = (event) => submitEngagementForm(event, "/api/announcements");

getElement("#startPlan").onclick = () => switchWorkspaceView("employees");
getElement("#testGenAi").onclick = async (event) => {
  const button = event.currentTarget;
  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = "Testing…";
  try {
    const result = await requestJson("/api/genai/test", { method: "POST" });
    showToast(`${result.message} ${result.provider} · ${result.model}`);
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
};
getElement("#reportExport").onchange = (event) => {
  const type = event.target.value;
  if (type) window.location = `/api/export/compliance.${type}`;
  event.target.value = "";
};
getElement("#logout").onclick = async () => {
  await requestJson("/api/auth/logout", { method: "POST" });
  window.location = "/";
};

loadWorkspaceData();
