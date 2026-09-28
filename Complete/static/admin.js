// SkillSprint AI - Admin / Manager / Reviewer CRM Workspace Controller

const appState = {
  currentUser: null,
  employees: [],
  users: [],
  documents: [],
  requirements: [],
  onboardingPlans: [],
  events: [],
  announcements: [],
  leaveRequests: [],
  roles: [],
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

async function requestJson(url, options = {}) {
  const controller = new AbortController();
  const requestTimeout = setTimeout(() => controller.abort(), options.timeoutMs || 60000);
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
      throw new Error("Request timed out. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(requestTimeout);
  }
}

function showToast(message, type = "success") {
  const toastElement = getElement("#toast");
  if (!toastElement) return;
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
  getElement(`#${viewName}`)?.classList.add("active");
  const titleElem = getElement("#title");
  if (titleElem) {
    titleElem.textContent = navigationButton?.textContent || "Welcome to SkillSprint";
  }
}

// Chart rendering
function drawBarChart(canvasSelector, chartRows) {
  const chartCanvas = getElement(canvasSelector);
  if (!chartCanvas) return;
  const drawingContext = chartCanvas.getContext("2d");
  const deviceScale = window.devicePixelRatio || 1;
  const chartWidth = chartCanvas.clientWidth || 300;
  const chartHeight = chartCanvas.clientHeight || 180;

  chartCanvas.width = chartWidth * deviceScale;
  chartCanvas.height = chartHeight * deviceScale;
  drawingContext.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);
  drawingContext.clearRect(0, 0, chartWidth, chartHeight);

  if (!chartRows.length) return;

  const maximumValue = Math.max(...chartRows.map((row) => row.count ?? row.completed ?? 0), 1);
  const gapSize = 14;
  const barWidth = Math.max(22, (chartWidth - gapSize * (chartRows.length + 1)) / Math.max(chartRows.length, 1));

  chartRows.forEach((chartRow, index) => {
    const value = chartRow.count ?? chartRow.completed ?? 0;
    const barHeight = ((chartHeight - 54) * value) / maximumValue;
    const leftPosition = gapSize + index * (barWidth + gapSize);

    drawingContext.fillStyle = index % 2 ? "hsla(162, 88%, 35%, 1)" : "hsla(199, 67%, 31%, 1)";
    drawingContext.fillRect(leftPosition, chartHeight - 30 - barHeight, barWidth, barHeight);
    drawingContext.fillStyle = "hsla(208, 18%, 38%, 1)";
    drawingContext.font = "12px Arial";
    drawingContext.textAlign = "center";
    drawingContext.fillText(String(value), leftPosition + barWidth / 2, chartHeight - 36 - barHeight);
    drawingContext.fillText((chartRow.status || chartRow.role || "").slice(0, 13), leftPosition + barWidth / 2, chartHeight - 10);
  });
}

// Employee Table Rendering
function renderEmployeeTable() {
  const searchInput = getElement("#employeeSearch");
  const searchText = searchInput ? searchInput.value.toLowerCase() : "";
  const canGeneratePlans = ["admin", "manager"].includes(appState.currentUser?.role);
  const matchingEmployees = appState.employees.filter((employee) =>
    `${employee.name} ${employee.role} ${employee.department}`.toLowerCase().includes(searchText)
  );

  const rowsElem = getElement("#employeeRows");
  if (!rowsElem) return;

  rowsElem.innerHTML = matchingEmployees.length
    ? matchingEmployees.map((employee) => {
        const action = canGeneratePlans
          ? `<button class="generate-plan-button primary-btn" style="padding:6px 12px; font-size:12px;" data-employee-id="${employee.id}">Generate plan</button>`
          : "Read only";

        const assignedPlan = appState.onboardingPlans.find((p) => p.employee_id === employee.id);
        const planStatusHtml = assignedPlan
          ? `<span class="tag ${assignedPlan.status === "Verified" ? "ok" : "warn"}">${assignedPlan.status}</span>`
          : '<span style="color:#94a3b8; font-size:12px;">No plan yet</span>';

        return `<tr>
          <td><b>${escapeHtml(employee.name)}</b><small>${employee.id}</small></td>
          <td>${escapeHtml(employee.role)}</td>
          <td>${escapeHtml(employee.department)}</td>
          <td>${escapeHtml(employee.experience)}</td>
          <td>${planStatusHtml}</td>
          <td>${action}</td>
        </tr>`;
      }).join("")
    : '<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:20px;">No employees match your search.</td></tr>';

  document.querySelectorAll(".generate-plan-button").forEach((button) => {
    button.onclick = () => generateOnboardingPlan(button);
  });
}

// User Accounts Table Rendering
function renderUserTable() {
  const searchInput = getElement("#userSearch");
  const searchText = searchInput ? searchInput.value.toLowerCase() : "";
  const canToggle = appState.currentUser?.role === "admin";
  const matchingUsers = appState.users.filter((user) =>
    `${user.username} ${user.role} ${user.employee_name || ""} ${user.employee_id || ""}`.toLowerCase().includes(searchText)
  );

  const rowsElem = getElement("#userRows");
  if (!rowsElem) return;

  rowsElem.innerHTML = matchingUsers.length
    ? matchingUsers.map((user) => {
        const isActive = Boolean(user.active);
        const statusTag = isActive
          ? '<span class="tag ok">Active</span>'
          : '<span class="tag danger">Disabled</span>';

        const isSelf = user.username === appState.currentUser?.username;
        const isAdminMaster = user.username === "admin";

        let actionBtn = "";
        if (canToggle && !isSelf && !isAdminMaster) {
          actionBtn = `<button class="toggle-user-btn secondary-action" data-user-id="${user.id}" style="padding:5px 10px; font-size:12px; cursor:pointer;">${isActive ? "Deactivate" : "Activate"}</button>`;
        } else if (isAdminMaster) {
          actionBtn = '<small style="color:#64748b;">Primary Admin</small>';
        } else if (isSelf) {
          actionBtn = '<small style="color:#64748b;">Current Session</small>';
        } else {
          actionBtn = '<small style="color:#64748b;">View only</small>';
        }

        return `<tr>
          <td><code>${escapeHtml(user.id)}</code></td>
          <td><b>${escapeHtml(user.username)}</b></td>
          <td><span class="tag ${user.role === "admin" ? "danger" : user.role === "manager" ? "warn" : "ok"}">${escapeHtml(user.role.toUpperCase())}</span></td>
          <td>${user.employee_name ? `<b>${escapeHtml(user.employee_name)}</b><small>${user.employee_id}</small>` : '<span style="color:#94a3b8;">None</span>'}</td>
          <td>${user.department ? `${escapeHtml(user.department)} · ${escapeHtml(user.job_role || "")}` : '<span style="color:#94a3b8;">-</span>'}</td>
          <td>${statusTag}</td>
          <td>${actionBtn}</td>
        </tr>`;
      }).join("")
    : '<tr><td colspan="7" style="text-align:center; color:#94a3b8; padding:20px;">No user accounts found.</td></tr>';

  document.querySelectorAll(".toggle-user-btn").forEach((btn) => {
    btn.onclick = async () => {
      btn.disabled = true;
      try {
        const res = await requestJson(`/api/admin/users/${btn.dataset.userId}/toggle-status`, { method: "POST" });
        showToast(res.message);
        await loadUsers();
      } catch (err) {
        showToast(err.message, "error");
        btn.disabled = false;
      }
    };
  });
}

// Documents Register
function renderDocumentRegister() {
  const searchText = (getElement("#docSearch")?.value || "").toLowerCase();
  const canApprove = ["admin", "reviewer"].includes(appState.currentUser?.role);
  const matchingDocuments = appState.documents.filter((doc) =>
    `${doc.title} ${doc.id} ${doc.category}`.toLowerCase().includes(searchText)
  );

  const container = getElement("#docs");
  if (!container) return;

  container.innerHTML = matchingDocuments.length
    ? matchingDocuments.map((doc) => {
        let actionHtml = "";
        if (doc.injection_flag) {
          actionHtml = '<span class="tag danger">Security Flagged</span>';
        } else if (doc.status === "Pending Review" && canApprove) {
          actionHtml = `<button class="approve-doc-btn primary-btn" data-doc-id="${doc.id}" style="padding:6px 12px; font-size:12px;">Approve</button>`;
        } else {
          actionHtml = `<span class="tag ${doc.status === "Active" ? "ok" : "warn"}">${doc.status}</span>`;
        }

        return `<div class="record">
          <div>
            <b>${escapeHtml(doc.title)}</b>
            <small>${doc.id} · v${escapeHtml(doc.version)} · ${escapeHtml(doc.category)} · Dept: ${escapeHtml(doc.department)}</small>
          </div>
          <div>${actionHtml}</div>
        </div>`;
      }).join("")
    : '<p class="sub">No matching documents found.</p>';

  document.querySelectorAll(".approve-doc-btn").forEach((btn) => {
    btn.onclick = async () => {
      btn.disabled = true;
      btn.textContent = "Approving...";
      try {
        const res = await requestJson(`/api/documents/${btn.dataset.docId}/approve`, { method: "POST" });
        showToast(res.message);
        await loadDocuments();
        await loadRequirements();
        await loadOverview();
      } catch (err) {
        showToast(err.message, "error");
        btn.disabled = false;
        btn.textContent = "Approve";
      }
    };
  });
}

// Plan Register
function renderPlanRegister() {
  const container = getElement("#plansList");
  if (!container) return;

  container.innerHTML = appState.onboardingPlans.length
    ? appState.onboardingPlans.map((plan) => {
        let validationReport = {};
        try { validationReport = JSON.parse(plan.report_json || "{}"); } catch (_) {}
        const isApproved = ["Approved", "Override", "Approved automatically"].includes(plan.review_status);

        return `<div class="record">
          <div>
            <b>${escapeHtml(plan.employee_id)} - ${escapeHtml(plan.role)}</b>
            <small>${plan.created_at} · Status: <b>${escapeHtml(plan.status)}</b> · Coverage: ${validationReport.coverage_score ?? 100}% · Traceability: ${validationReport.traceability_score ?? 100}%</small>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            <span class="tag ${isApproved ? "ok" : "warn"}">${isApproved ? "Published to Employee" : "Needs Review"}</span>
            <button class="view-plan-btn secondary-action" data-plan-id="${plan.id}" style="padding:6px 12px; font-size:12px;">View &amp; Review</button>
          </div>
        </div>`;
      }).join("")
    : '<p class="sub">No onboarding plans generated yet.</p>';

  document.querySelectorAll(".view-plan-btn").forEach((btn) => {
    btn.onclick = () => openPlanDetail(btn.dataset.planId);
  });
}

// Open Plan Details Modal / Panel
async function openPlanDetail(planId) {
  try {
    const detail = await requestJson(`/api/plans/${planId}`);
    const panel = getElement("#planDetailPanel");
    const title = getElement("#planDetailTitle");
    const content = getElement("#planDetailContent");
    if (!panel || !content) return;

    title.textContent = `Plan: ${detail.id} (${detail.role} - ${detail.employee_id})`;
    const isApproved = ["Approved", "Override", "Approved automatically"].includes(detail.review_status);

    const items = detail.plan?.generated_items || [];
    let itemsHtml = items.map((item, idx) => `
      <div style="padding:10px; margin-bottom:8px; background:#f8fafc; border-radius:6px; border:1px solid #e2e8f0;">
        <b>${idx + 1}. ${escapeHtml(item.module || item.role)}</b>
        <p style="margin:4px 0; font-size:13px;">${escapeHtml(item.objective)}</p>
        <small style="color:#64748b;">Stage: <b>${escapeHtml(item.due_stage)}</b> · Req: <b>${escapeHtml(item.mandatory)}</b> · Source: <code>${escapeHtml(item.source_document_id)} ${escapeHtml(item.source_section_id)}</code></small>
      </div>
    `).join("");

    content.innerHTML = `
      <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; margin-bottom:16px;">
        <div style="padding:10px; background:#f0fdf4; border-radius:6px;"><b>${detail.validation?.coverage_score ?? 100}%</b><small style="display:block; color:#166534;">Coverage</small></div>
        <div style="padding:10px; background:#f0f9ff; border-radius:6px;"><b>${detail.validation?.traceability_score ?? 100}%</b><small style="display:block; color:#075985;">Traceability</small></div>
        <div style="padding:10px; background:#faf5ff; border-radius:6px;"><b>${detail.status}</b><small style="display:block; color:#6b21a8;">Status</small></div>
        <div style="padding:10px; background:#fff7ed; border-radius:6px;"><b>${detail.review_status}</b><small style="display:block; color:#9a3412;">Review</small></div>
      </div>
      <div style="margin-bottom:16px;">
        <h3 style="margin:0 0 10px; font-size:15px;">Generated Learning Modules (${items.length})</h3>
        ${itemsHtml}
      </div>
      ${!isApproved ? `
        <div style="padding:14px; background:#f1f5f9; border-radius:8px; display:flex; gap:10px; align-items:center;">
          <input id="reviewComment" placeholder="Optional review comment..." style="flex:1; padding:8px 12px; border:1px solid #cbd5e1; border-radius:6px;" />
          <button id="approvePlanBtn" class="primary-btn" style="padding:8px 16px;">Approve &amp; Release to Employee</button>
        </div>
      ` : '<p style="color:#166534; font-weight:600;">✓ This plan is approved and active in the employee learning portal.</p>'}
    `;

    panel.style.display = "block";
    panel.scrollIntoView({ behavior: "smooth" });

    const approveBtn = getElement("#approvePlanBtn");
    if (approveBtn) {
      approveBtn.onclick = async () => {
        approveBtn.disabled = true;
        try {
          const comment = getElement("#reviewComment")?.value || "";
          await requestJson(`/api/plans/${planId}/review`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decision: "Approved", comment }),
          });
          showToast("Plan approved and released to the employee!");
          await loadPlans();
          await openPlanDetail(planId);
        } catch (err) {
          showToast(err.message, "error");
          approveBtn.disabled = false;
        }
      };
    }
  } catch (err) {
    showToast(err.message, "error");
  }
}

// Requirements Matrix
function renderRequirementMatrix() {
  const searchText = (getElement("#matrixSearch")?.value || "").toLowerCase();
  const matchingReqs = appState.requirements.filter((req) =>
    `${req.id} ${req.role} ${req.description} ${req.document_id}`.toLowerCase().includes(searchText)
  );

  const visible = searchText ? matchingReqs.slice(0, 100) : matchingReqs.slice(0, 20);
  const countElem = getElement("#matrixCount");
  if (countElem) {
    countElem.textContent = `Showing ${visible.length} of ${matchingReqs.length} records`;
  }

  const rowsElem = getElement("#matrixRows");
  if (!rowsElem) return;

  rowsElem.innerHTML = visible.map((r) => `<tr>
    <td><code>${r.id}</code></td>
    <td><b>${escapeHtml(r.role)}</b></td>
    <td>${escapeHtml(r.description)}</td>
    <td><span class="tag ${r.mandatory === "Mandatory" ? "danger" : "ok"}">${escapeHtml(r.classification || r.mandatory)}</span></td>
    <td><code>${r.document_id} ${r.section_ref}</code></td>
    <td>${r.due_stage}</td>
  </tr>`).join("");
}

// Leave Requests
function renderLeaveRequests() {
  const container = getElement("#leaveRequestsList");
  if (!container) return;

  const canReview = ["admin", "manager"].includes(appState.currentUser?.role);
  container.innerHTML = appState.leaveRequests.length
    ? appState.leaveRequests.map((leave) => {
        const isPending = leave.status === "Pending";
        const actions = isPending && canReview
          ? `<button class="approve-leave-btn primary-btn" data-leave-id="${leave.id}" style="padding:4px 10px; font-size:12px; margin-right:6px;">Approve</button>
             <button class="decline-leave-btn secondary-action" data-leave-id="${leave.id}" style="padding:4px 10px; font-size:12px;">Decline</button>`
          : `<span class="tag ${leave.status === "Approved" ? "ok" : leave.status === "Declined" ? "danger" : "warn"}">${leave.status}</span>`;

        return `<div class="record">
          <div>
            <b>${escapeHtml(leave.name || leave.employee_id)} (${escapeHtml(leave.role || "Employee")})</b> · ${escapeHtml(leave.leave_type)}
            <small>${leave.start_date} to ${leave.end_date} · Reason: ${escapeHtml(leave.reason)}</small>
          </div>
          <div>${actions}</div>
        </div>`;
      }).join("")
    : '<p class="sub">No leave requests to show.</p>';

  document.querySelectorAll(".approve-leave-btn").forEach((btn) => {
    btn.onclick = () => handleLeaveReview(btn.dataset.leaveId, "Approved");
  });
  document.querySelectorAll(".decline-leave-btn").forEach((btn) => {
    btn.onclick = () => handleLeaveReview(btn.dataset.leaveId, "Declined");
  });
}

async function handleLeaveReview(leaveId, status) {
  try {
    const res = await requestJson(`/api/leave-requests/${leaveId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    showToast(res.message);
    await loadLeaveRequests();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// Generate Plan
async function generateOnboardingPlan(button) {
  const employeeId = button.dataset.employeeId;
  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = "Generating...";

  try {
    const result = await requestJson(`/api/generate/${employeeId}`, { method: "POST" });
    showToast(`Plan created and verified (${result.validation.status}).`);
    await loadPlans();
    renderEmployeeTable();
    switchWorkspaceView("plans");
    openPlanDetail(result.id);
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
}

// Load Data Functions
async function loadOverview() {
  try {
    const data = await requestJson("/api/dashboard");
    getElement("#metrics").innerHTML = `
      <div><b>${data.employees}</b><small>Employees</small></div>
      <div><b>${data.active_documents}</b><small>Active Docs</small></div>
      <div><b>${data.documents}</b><small>Total Docs</small></div>
      <div><b>${data.requirements}</b><small>Requirements</small></div>
      <div><b>${data.plans}</b><small>Plans</small></div>
      <div><b>${data.injections}</b><small>Flags</small></div>
    `;

    const analytics = await requestJson("/api/analytics");
    drawBarChart("#planChart", analytics.plan_status || []);
    drawBarChart("#docChart", analytics.document_status || []);

    const queueElem = getElement("#queue");
    if (queueElem) {
      queueElem.innerHTML = analytics.flagged?.length
        ? analytics.flagged.map((item) => `<div class="record"><div><b>${escapeHtml(item.title)}</b><small>${item.id} · ${item.status}</small></div><span class="tag ${item.injection_flag ? "danger" : "warn"}">${item.injection_flag ? "Security Review Required" : item.status}</span></div>`).join("")
        : '<p class="sub">Everything is in good order. No urgent items require attention.</p>';
    }
  } catch (_) {}
}

async function loadEmployees() {
  try {
    appState.employees = await requestJson("/api/employees");
    renderEmployeeTable();
  } catch (_) {}
}

async function loadUsers() {
  try {
    appState.users = await requestJson("/api/admin/users");
    renderUserTable();
  } catch (_) {}
}

async function loadDocuments() {
  try {
    appState.documents = await requestJson("/api/documents");
    renderDocumentRegister();
  } catch (_) {}
}

async function loadRequirements() {
  try {
    appState.requirements = await requestJson("/api/requirements");
    renderRequirementMatrix();
  } catch (_) {}
}

async function loadPlans() {
  try {
    appState.onboardingPlans = await requestJson("/api/plans");
    renderPlanRegister();
  } catch (_) {}
}

async function loadLeaveRequests() {
  try {
    appState.leaveRequests = await requestJson("/api/leave-requests");
    renderLeaveRequests();
  } catch (_) {}
}

async function loadRoles() {
  try {
    const res = await requestJson("/api/roles");
    appState.roles = res.roles || [];
    const empRoleSelect = getElement("#adminNewEmployeeRole");
    const docRoleSelect = getElement("#docRoleSelect");
    if (empRoleSelect && appState.roles.length) {
      empRoleSelect.innerHTML = appState.roles.map((r) => `<option value="${r}">${r}</option>`).join("");
    }
    if (docRoleSelect && appState.roles.length) {
      docRoleSelect.innerHTML = '<option value="All Employees">All Employees</option>' + appState.roles.map((r) => `<option value="${r}">${r}</option>`).join("");
    }
  } catch (_) {}
}

// Initial Boot
async function initializeWorkspace() {
  try {
    appState.currentUser = await requestJson("/api/auth/me");
    getElement("#identity").textContent = `${appState.currentUser.role.toUpperCase()} WORKSPACE · ${appState.currentUser.username}`;

    await loadRoles();
    await loadOverview();
    await loadEmployees();
    await loadUsers();
    await loadDocuments();
    await loadRequirements();
    await loadPlans();
    await loadLeaveRequests();
  } catch (error) {
    if (error.statusCode === 401) {
      window.location = "/login";
    } else {
      showToast("Unable to load workspace.", "error");
    }
  }
}

// Event Listeners Setup
document.querySelectorAll("nav button.nav").forEach((button) => {
  button.onclick = () => switchWorkspaceView(button.dataset.view);
});

document.querySelectorAll(".go-to-view").forEach((button) => {
  button.onclick = () => switchWorkspaceView(button.dataset.goTo);
});

getElement("#logout")?.addEventListener("click", async () => {
  await requestJson("/api/auth/logout", { method: "POST" });
  window.location = "/";
});

// Add Employee Form Toggles
const toggleBtn = getElement("#toggleAddEmployeeModal");
const addPanel = getElement("#addEmployeePanel");
const cancelAddBtn = getElement("#cancelAddEmployeeBtn");
const createEmpForm = getElement("#createEmployeeForm");

toggleBtn?.addEventListener("click", () => {
  addPanel.style.display = addPanel.style.display === "none" ? "block" : "none";
  if (addPanel.style.display === "block") {
    addPanel.scrollIntoView({ behavior: "smooth" });
  }
});

cancelAddBtn?.addEventListener("click", () => {
  addPanel.style.display = "none";
});

createEmpForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const saveBtn = getElement("#saveEmployeeBtn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Registering...";

  const formData = new FormData(createEmpForm);
  const data = Object.fromEntries(formData);
  data.auto_generate_plan = formData.get("auto_generate_plan") === "1";

  try {
    const res = await requestJson("/api/admin/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    showToast(res.message);
    createEmpForm.reset();
    addPanel.style.display = "none";
    await loadEmployees();
    await loadUsers();
    await loadPlans();
    await loadOverview();
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save & Register";
  }
});

// Subtabs
const tabProfiles = getElement("#tabEmployeeProfiles");
const tabUsers = getElement("#tabUserAccounts");
const secProfiles = getElement("#employeeProfilesSection");
const secUsers = getElement("#userAccountsSection");

tabProfiles?.addEventListener("click", () => {
  tabProfiles.classList.add("active-subtab");
  tabUsers.classList.remove("active-subtab");
  secProfiles.style.display = "block";
  secUsers.style.display = "none";
});

tabUsers?.addEventListener("click", () => {
  tabUsers.classList.add("active-subtab");
  tabProfiles.classList.remove("active-subtab");
  secUsers.style.display = "block";
  secProfiles.style.display = "none";
  renderUserTable();
});

// Search inputs
getElement("#employeeSearch")?.addEventListener("input", renderEmployeeTable);
getElement("#userSearch")?.addEventListener("input", renderUserTable);
getElement("#docSearch")?.addEventListener("input", renderDocumentRegister);
getElement("#matrixSearch")?.addEventListener("input", renderRequirementMatrix);

getElement("#refreshEmployees")?.addEventListener("click", loadEmployees);
getElement("#refreshUsers")?.addEventListener("click", loadUsers);
getElement("#closePlanDetail")?.addEventListener("click", () => {
  getElement("#planDetailPanel").style.display = "none";
});

// Upload Form
getElement("#upload")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = getElement("#uploadBtn");
  btn.disabled = true;
  btn.textContent = "Uploading & Processing...";
  try {
    const res = await requestJson("/api/documents/upload", {
      method: "POST",
      body: new FormData(e.target),
    });
    showToast(res.message + (res.injection_flag ? " [Security Review Flagged]" : ""));
    e.target.reset();
    await loadDocuments();
    await loadOverview();
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Upload Document";
  }
});

// Event Form
getElement("#eventForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const res = await requestJson("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(e.target))),
    });
    showToast(res.message);
    e.target.reset();
  } catch (err) {
    showToast(err.message, "error");
  }
});

// Announcement Form
getElement("#announcementForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const res = await requestJson("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(e.target))),
    });
    showToast(res.message);
    e.target.reset();
  } catch (err) {
    showToast(err.message, "error");
  }
});

// Test GenAI
getElement("#testGenAi")?.addEventListener("click", async () => {
  const btn = getElement("#testGenAi");
  btn.disabled = true;
  btn.textContent = "Testing...";
  try {
    const res = await requestJson("/api/genai/test", { method: "POST" });
    showToast(`${res.provider} (${res.model}) connection is active!`);
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Test GenAI";
  }
});

// Start plan shortcut
getElement("#startPlan")?.addEventListener("click", () => {
  switchWorkspaceView("employees");
});

// Export report
getElement("#reportExport")?.addEventListener("change", (e) => {
  const format = e.target.value;
  if (!format) return;
  window.open(`/api/export/compliance.${format}`, "_blank");
  e.target.value = "";
});

initializeWorkspace();
