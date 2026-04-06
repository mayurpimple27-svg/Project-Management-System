import mongoose from "mongoose";
import { Project } from "../models/project.models.js";
import { ProjectNote } from "../models/note.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

const ensureProjectExists = async (projectId) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  return project;
};

const getProjectNotes = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  await ensureProjectExists(projectId);

  const notes = await ProjectNote.find({
    project: new mongoose.Types.ObjectId(projectId),
  })
    .populate("createdBy", "avatar username fullName")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, notes, "Project notes fetched successfully"));
});

const createProjectNote = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { content } = req.body;

  await ensureProjectExists(projectId);

  const note = await ProjectNote.create({
    project: new mongoose.Types.ObjectId(projectId),
    createdBy: new mongoose.Types.ObjectId(req.user._id),
    content,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, note, "Project note created successfully"));
});

const getNoteById = asyncHandler(async (req, res) => {
  const { projectId, noteId } = req.params;

  await ensureProjectExists(projectId);

  const note = await ProjectNote.findOne({
    _id: new mongoose.Types.ObjectId(noteId),
    project: new mongoose.Types.ObjectId(projectId),
  }).populate("createdBy", "avatar username fullName");

  if (!note) {
    throw new ApiError(404, "Project note not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, note, "Project note fetched successfully"));
});

const updateProjectNote = asyncHandler(async (req, res) => {
  const { projectId, noteId } = req.params;
  const { content } = req.body;

  await ensureProjectExists(projectId);

  const note = await ProjectNote.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(noteId),
      project: new mongoose.Types.ObjectId(projectId),
    },
    {
      content,
    },
    {
      new: true,
      runValidators: true,
    },
  ).populate("createdBy", "avatar username fullName");

  if (!note) {
    throw new ApiError(404, "Project note not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, note, "Project note updated successfully"));
});

const deleteProjectNote = asyncHandler(async (req, res) => {
  const { projectId, noteId } = req.params;

  await ensureProjectExists(projectId);

  const note = await ProjectNote.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(noteId),
    project: new mongoose.Types.ObjectId(projectId),
  });

  if (!note) {
    throw new ApiError(404, "Project note not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, note, "Project note deleted successfully"));
});

export {
  createProjectNote,
  deleteProjectNote,
  getNoteById,
  getProjectNotes,
  updateProjectNote,
};
