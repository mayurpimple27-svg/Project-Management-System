import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { ProjectJoinRequest } from "../models/projectjoinrequest.models.js";
import { Task } from "../models/task.models.js";
import { Subtask } from "../models/subtask.models.js";
import { ProjectNote } from "../models/note.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import mongoose from "mongoose";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";

const getProjects = asyncHandler(async (req, res) => {
  const projects = await ProjectMember.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "projects",
        localField: "project",
        foreignField: "_id",
        as: "project",
      },
    },
    {
      $unwind: "$project",
    },
    {
      $lookup: {
        from: "projectmembers",
        localField: "project._id",
        foreignField: "project",
        as: "projectmembers",
      },
    },
    {
      $project: {
        project: {
          _id: "$project._id",
          name: "$project.name",
          description: "$project.description",
          members: {
            $size: "$projectmembers",
          },
          createdAt: "$project.createdAt",
          createdBy: "$project.createdBy",
        },
        role: 1,
        _id: 0,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, projects, "Projects fetched successfully"));
});

const discoverProjects = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);

  const [memberRows, pendingRows, allProjects] = await Promise.all([
    ProjectMember.find({ user: userId }).select("project"),
    ProjectJoinRequest.find({
      requestedBy: userId,
      status: "pending",
    }).select("project"),
    Project.find({}).sort({ createdAt: -1 }),
  ]);

  const memberProjectIds = new Set(memberRows.map((entry) => String(entry.project)));
  const pendingProjectIds = new Set(
    pendingRows.map((entry) => String(entry.project)),
  );

  const data = allProjects.map((project) => ({
    _id: project._id,
    name: project.name,
    description: project.description,
    createdBy: project.createdBy,
    createdAt: project.createdAt,
    isMember: memberProjectIds.has(String(project._id)),
    hasPendingRequest: pendingProjectIds.has(String(project._id)),
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Active projects discovered successfully"));
});

const getProjectById = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project fetched successfully"));
});

const createProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const project = await Project.create({
    name,
    description,
    createdBy: new mongoose.Types.ObjectId(req.user._id),
  });

  await ProjectMember.create({
    user: new mongoose.Types.ObjectId(req.user._id),
    project: new mongoose.Types.ObjectId(project._id),
    role: UserRolesEnum.ADMIN,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, project, "Project created Successfully"));
});

const updateProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const { projectId } = req.params;

  const project = await Project.findByIdAndUpdate(
    projectId,
    {
      name,
      description,
    },
    { new: true },
  );

  if (!project) {
    throw new ApiError(404, "Project not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project updated successfully"));
});

const deleteProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const taskIds = await Task.find({
    project: new mongoose.Types.ObjectId(projectId),
  }).distinct("_id");

  await Promise.all([
    Project.findByIdAndDelete(projectId),
    ProjectMember.deleteMany({
      project: new mongoose.Types.ObjectId(projectId),
    }),
    Task.deleteMany({
      project: new mongoose.Types.ObjectId(projectId),
    }),
    ProjectNote.deleteMany({
      project: new mongoose.Types.ObjectId(projectId),
    }),
    Subtask.deleteMany({
      task: { $in: taskIds },
    }),
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project deleted successfully"));
});

const addMembersToProject = asyncHandler(async (req, res) => {
  const { email, role } = req.body;
  const { projectId } = req.params;
  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User does not exists");
  }

  await ProjectMember.findOneAndUpdate(
    {
      user: new mongoose.Types.ObjectId(user._id),
      project: new mongoose.Types.ObjectId(projectId),
    },
    {
      user: new mongoose.Types.ObjectId(user._id),
      project: new mongoose.Types.ObjectId(projectId),
      role: role,
    },
    {
      new: true,
      upsert: true,
    },
  );

  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Project member added successfully"));
});

const getProjectMembers = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const projectMembers = await ProjectMember.aggregate([
    {
      $match: {
        project: new mongoose.Types.ObjectId(projectId),
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        user: {
          $arrayElemAt: ["$user", 0],
        },
      },
    },
    {
      $project: {
        project: 1,
        user: 1,
        role: 1,
        createdAt: 1,
        updatedAt: 1,
        _id: 0,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, projectMembers, "Project members fetched"));
});

const requestToJoinProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const userId = new mongoose.Types.ObjectId(req.user._id);

  const existingMember = await ProjectMember.findOne({
    project: new mongoose.Types.ObjectId(projectId),
    user: userId,
  });

  if (existingMember) {
    throw new ApiError(400, "You are already a member of this project");
  }

  const existingPending = await ProjectJoinRequest.findOne({
    project: new mongoose.Types.ObjectId(projectId),
    requestedBy: userId,
    status: "pending",
  });

  if (existingPending) {
    throw new ApiError(400, "Join request already pending");
  }

  const joinRequest = await ProjectJoinRequest.create({
    project: new mongoose.Types.ObjectId(projectId),
    requestedBy: userId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, joinRequest, "Join request submitted"));
});

const getJoinRequestsForProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const requests = await ProjectJoinRequest.find({
    project: new mongoose.Types.ObjectId(projectId),
    status: "pending",
  })
    .populate("requestedBy", "_id username fullName email avatar")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, requests, "Join requests fetched successfully"));
});

const processJoinRequest = asyncHandler(async (req, res) => {
  const { projectId, requestId } = req.params;
  const { action } = req.body;

  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const joinRequest = await ProjectJoinRequest.findOne({
    _id: new mongoose.Types.ObjectId(requestId),
    project: new mongoose.Types.ObjectId(projectId),
    status: "pending",
  });

  if (!joinRequest) {
    throw new ApiError(404, "Join request not found");
  }

  if (action === "approve") {
    await ProjectMember.findOneAndUpdate(
      {
        project: joinRequest.project,
        user: joinRequest.requestedBy,
      },
      {
        project: joinRequest.project,
        user: joinRequest.requestedBy,
        role: UserRolesEnum.MEMBER,
      },
      { upsert: true, new: true },
    );

    joinRequest.status = "approved";
  } else {
    joinRequest.status = "rejected";
  }

  joinRequest.reviewedBy = new mongoose.Types.ObjectId(req.user._id);
  await joinRequest.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(200, joinRequest, `Join request ${joinRequest.status}`),
  );
});

const updateMemberRole = asyncHandler(async (req, res) => {
  const { projectId, userId } = req.params;
  const { newRole } = req.body;

  if (!AvailableUserRole.includes(newRole)) {
    throw new ApiError(400, "Invalid Role");
  }

  let projectMember = await ProjectMember.findOne({
    project: new mongoose.Types.ObjectId(projectId),
    user: new mongoose.Types.ObjectId(userId),
  });

  if (!projectMember) {
    throw new ApiError(400, "Project member not found");
  }

  projectMember = await ProjectMember.findByIdAndUpdate(
    projectMember._id,
    {
      role: newRole,
    },
    { new: true },
  );

  if (!projectMember) {
    throw new ApiError(400, "Project member not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        projectMember,
        "Project member role updated successfully",
      ),
    );
});

const deleteMember = asyncHandler(async (req, res) => {
  const { projectId, userId } = req.params;

  let projectMember = await ProjectMember.findOne({
    project: new mongoose.Types.ObjectId(projectId),
    user: new mongoose.Types.ObjectId(userId),
  });

  if (!projectMember) {
    throw new ApiError(400, "Project member not found");
  }

  projectMember = await ProjectMember.findByIdAndDelete(projectMember._id);

  if (!projectMember) {
    throw new ApiError(400, "Project member not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        projectMember,
        "Project member deleted successfully",
      ),
    );
});

export {
  addMembersToProject,
  createProject,
  deleteMember,
  discoverProjects,
  getProjects,
  getProjectById,
  getJoinRequestsForProject,
  getProjectMembers,
  processJoinRequest,
  requestToJoinProject,
  updateProject,
  deleteProject,
  updateMemberRole,
};
