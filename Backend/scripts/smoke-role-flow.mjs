const baseUrl = process.env.SMOKE_BASE_URL || "http://localhost:3000/api/v1";

const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const adminEmail = `admin${suffix}@example.com`;
const adminUsername = `admin${suffix}`;
const memberEmail = `member${suffix}@example.com`;
const memberUsername = `member${suffix}`;
const password = "Pass@1234";

const requestJson = async ({ method, path, token, body }) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || `${method} ${path} failed`;
    throw new Error(`${response.status} ${message}`);
  }

  return data;
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const run = async () => {
  console.log("1) Register admin and member");
  await requestJson({
    method: "POST",
    path: "/auth/register",
    body: {
      email: adminEmail,
      username: adminUsername,
      fullName: "Admin User",
      password,
    },
  });

  await requestJson({
    method: "POST",
    path: "/auth/register",
    body: {
      email: memberEmail,
      username: memberUsername,
      fullName: "Member User",
      password,
    },
  });

  console.log("2) Login admin and member");
  const adminLogin = await requestJson({
    method: "POST",
    path: "/auth/login",
    body: { email: adminEmail, password },
  });
  const memberLogin = await requestJson({
    method: "POST",
    path: "/auth/login",
    body: { email: memberEmail, password },
  });

  const adminToken = adminLogin?.data?.accessToken;
  const memberToken = memberLogin?.data?.accessToken;
  const memberUserId = memberLogin?.data?.user?._id;

  assert(adminToken, "Admin access token missing");
  assert(memberToken, "Member access token missing");
  assert(memberUserId, "Member user id missing");

  console.log("3) Admin creates project");
  const projectRes = await requestJson({
    method: "POST",
    path: "/projects",
    token: adminToken,
    body: {
      name: `Project-${suffix}`,
      description: "Smoke validation project",
    },
  });

  const projectId = projectRes?.data?._id;
  assert(projectId, "Project id missing");

  console.log("4) Member discovers and requests access");
  const discoverRes = await requestJson({
    method: "GET",
    path: "/projects/discover",
    token: memberToken,
  });

  const foundProject = (discoverRes?.data || []).find((p) => p?._id === projectId);
  assert(foundProject, "Created project is not discoverable by member");

  await requestJson({
    method: "POST",
    path: `/projects/${projectId}/join-requests`,
    token: memberToken,
    body: {},
  });

  console.log("5) Admin approves join request");
  const pendingRes = await requestJson({
    method: "GET",
    path: `/projects/${projectId}/join-requests`,
    token: adminToken,
  });

  const joinRequest = (pendingRes?.data || []).find(
    (item) => item?.requestedBy?._id === memberUserId,
  );
  assert(joinRequest?._id, "Pending join request not found");

  await requestJson({
    method: "PATCH",
    path: `/projects/${projectId}/join-requests/${joinRequest._id}`,
    token: adminToken,
    body: { action: "approve" },
  });

  console.log("6) Admin assigns task to member");
  const taskRes = await requestJson({
    method: "POST",
    path: `/tasks/${projectId}`,
    token: adminToken,
    body: {
      title: "Assigned smoke task",
      description: "Validate member task visibility",
      assignedTo: memberUserId,
      status: "todo",
    },
  });

  const taskId = taskRes?.data?._id;
  assert(taskId, "Task id missing");

  console.log("7) Member loads tasks");
  const tasksRes = await requestJson({
    method: "GET",
    path: `/tasks/${projectId}`,
    token: memberToken,
  });

  const assignedTask = (tasksRes?.data || []).find((task) => task?._id === taskId);
  assert(assignedTask, "Assigned task not visible to member");

  console.log("SMOKE TEST PASSED");
  console.log(`projectId=${projectId}`);
  console.log(`memberId=${memberUserId}`);
  console.log(`taskId=${taskId}`);
};

run().catch((error) => {
  console.error("SMOKE TEST FAILED");
  console.error(error?.message || error);
  process.exit(1);
});
