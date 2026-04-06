import { Project } from "../models/project.models.js";
import { Task } from "../models/task.models.js";
import { Subtask } from "../models/subtask.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import mongoose from "mongoose";
import { UserRolesEnum } from "../utils/constants.js";

const ensureProjectExists = async (projectId) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  return project;
};

const getTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  await ensureProjectExists(projectId);

  const tasks = await Task.find({
    project: new mongoose.Types.ObjectId(projectId),
  })
    .populate("assignedTo", "avatar username fullName")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
});

const createTask = asyncHandler(async (req, res) => {
  const { title, description, assignedTo, status } = req.body;
  const { projectId } = req.params;

  await ensureProjectExists(projectId);

  if (assignedTo) {
    const assigneeMembership = await ProjectMember.findOne({
      project: new mongoose.Types.ObjectId(projectId),
      user: new mongoose.Types.ObjectId(assignedTo),
    });

    if (!assigneeMembership) {
      throw new ApiError(400, "Assignee must be a member of this project");
    }
  }

  const files = req.files || [];

  const attachments = files.map((file) => {
    return {
      url: `${process.env.SERVER_URL || `${req.protocol}://${req.get("host")}`}/images/${file.filename}`,
      mimetype: file.mimetype,
      size: file.size,
    };
  });

  const task = await Task.create({
    title,
    description,
    project: new mongoose.Types.ObjectId(projectId),
    assignedTo: assignedTo
      ? new mongoose.Types.ObjectId(assignedTo)
      : undefined,
    status,
    assignedBy: new mongoose.Types.ObjectId(req.user._id),
    attachments,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, task, "Task created successfully"));
});

const getTaskById = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;

  await ensureProjectExists(projectId);

  const task = await Task.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(taskId),
        project: new mongoose.Types.ObjectId(projectId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "assignedTo",
        foreignField: "_id",
        as: "assignedTo",
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
      $lookup: {
        from: "subtasks",
        localField: "_id",
        foreignField: "task",
        as: "subtasks",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "createdBy",
              foreignField: "_id",
              as: "createdBy",
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
              createdBy: {
                $arrayElemAt: ["$createdBy", 0],
              },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        assignedTo: {
          $arrayElemAt: ["$assignedTo", 0],
        },
      },
    },
  ]);

  if (!task || task.length === 0) {
    throw new ApiError(404, "Task not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, task[0], "Task fetched successfully"));
});

const updateTask = asyncHandler(async (req, res) => {
  const { taskId, projectId } = req.params;
  const { title, description, assignedTo, status } = req.body;

  await ensureProjectExists(projectId);

  const existingTask = await Task.findOne({
    _id: new mongoose.Types.ObjectId(taskId),
    project: new mongoose.Types.ObjectId(projectId),
  });

  if (!existingTask) {
    throw new ApiError(404, "Task not found");
  }

  if (assignedTo) {
    const assigneeMembership = await ProjectMember.findOne({
      project: new mongoose.Types.ObjectId(projectId),
      user: new mongoose.Types.ObjectId(assignedTo),
    });

    if (!assigneeMembership) {
      throw new ApiError(400, "Assignee must be a member of this project");
    }
  }

  const updatePayload = {};

  if (title !== undefined) {
    updatePayload.title = title;
  }

  if (description !== undefined) {
    updatePayload.description = description;
  }

  if (assignedTo !== undefined) {
    updatePayload.assignedTo = assignedTo
      ? new mongoose.Types.ObjectId(assignedTo)
      : undefined;
  }

  if (status !== undefined) {
    updatePayload.status = status;
  }

  const files = req.files || [];

  if (files.length > 0) {
    const newAttachments = files.map((file) => ({
      url: `${process.env.SERVER_URL || `${req.protocol}://${req.get("host")}`}/images/${file.filename}`,
      mimetype: file.mimetype,
      size: file.size,
    }));

    updatePayload.attachments = [...existingTask.attachments, ...newAttachments];
  }

  const task = await Task.findByIdAndUpdate(existingTask._id, updatePayload, {
    new: true,
    runValidators: true,
  }).populate("assignedTo", "avatar username fullName");

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Task updated successfully"));
});

const deleteTask = asyncHandler(async (req, res) => {
  const { taskId, projectId } = req.params;

  await ensureProjectExists(projectId);

  const task = await Task.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(taskId),
    project: new mongoose.Types.ObjectId(projectId),
  });

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  await Subtask.deleteMany({ task: task._id });

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Task deleted successfully"));
});

const createSubTask = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;
  const { title } = req.body;

  await ensureProjectExists(projectId);

  const task = await Task.findOne({
    _id: new mongoose.Types.ObjectId(taskId),
    project: new mongoose.Types.ObjectId(projectId),
  });

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const subTask = await Subtask.create({
    title,
    task: task._id,
    createdBy: new mongoose.Types.ObjectId(req.user._id),
  });

  return res
    .status(201)
    .json(new ApiResponse(201, subTask, "Subtask created successfully"));
});

const updateSubTask = asyncHandler(async (req, res) => {
  const { projectId, subTaskId } = req.params;
  const { title, isCompleted } = req.body;

  await ensureProjectExists(projectId);

  const subTaskDoc = await Subtask.findById(subTaskId);

  if (!subTaskDoc) {
    throw new ApiError(404, "Subtask not found");
  }

  const task = await Task.findOne({
    _id: subTaskDoc.task,
    project: new mongoose.Types.ObjectId(projectId),
  });

  if (!task) {
    throw new ApiError(404, "Subtask not found in this project");
  }

  if (req.user.role === UserRolesEnum.MEMBER) {
    if (title !== undefined) {
      throw new ApiError(403, "Members can only update completion status");
    }

    if (isCompleted === undefined) {
      throw new ApiError(400, "isCompleted is required");
    }
  }

  const updatePayload = {};

  if (title !== undefined) {
    updatePayload.title = title;
  }

  if (isCompleted !== undefined) {
    updatePayload.isCompleted = isCompleted;
  }

  if (Object.keys(updatePayload).length === 0) {
    throw new ApiError(400, "No valid fields provided for update");
  }

  const subTask = await Subtask.findByIdAndUpdate(subTaskId, updatePayload, {
    new: true,
    runValidators: true,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, subTask, "Subtask updated successfully"));
});

const deleteSubTask = asyncHandler(async (req, res) => {
  const { projectId, subTaskId } = req.params;

  await ensureProjectExists(projectId);

  const subTaskDoc = await Subtask.findById(subTaskId);

  if (!subTaskDoc) {
    throw new ApiError(404, "Subtask not found");
  }

  const task = await Task.findOne({
    _id: subTaskDoc.task,
    project: new mongoose.Types.ObjectId(projectId),
  });

  if (!task) {
    throw new ApiError(404, "Subtask not found in this project");
  }

  await Subtask.findByIdAndDelete(subTaskId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Subtask deleted successfully"));
});

export {
  deleteTask,
  getTaskById,
  getTasks,
  createSubTask,
  createTask,
  deleteSubTask,
  updateSubTask,
  updateTask,
};
