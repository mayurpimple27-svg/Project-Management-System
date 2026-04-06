import { body } from "express-validator";
import { AvailableTaskStatues, AvailableUserRole } from "../utils/constants.js";
const userRegisterValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),
    body("username")
      .trim()
      .notEmpty()
      .withMessage("Username is required")
      .isLowercase()
      .withMessage("Username must be in lower case")
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters long"),
    body("password").trim().notEmpty().withMessage("Password is required"),
    body("fullName").optional().trim(),
  ];
};

const userLoginValidator = () => {
  return [
    body("email").optional().isEmail().withMessage("Email is invalid"),
    body("password").notEmpty().withMessage("Password is required"),
  ];
};

const userChangeCurrentPasswordValidator = () => {
  return [
    body("oldPassword").notEmpty().withMessage("Old password is required"),
    body("newPassword").notEmpty().withMessage("New password is required"),
  ];
};

const userForgotPasswordValidator = () => {
  return [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),
  ];
};

const userResetForgotPasswordValidator = () => {
  return [body("newPassword").notEmpty().withMessage("Password is required")];
};

const createProjectValidator = () => {
  return [
    body("name").notEmpty().withMessage("Name is required"),
    body("description").optional(),
  ];
};

const addMembertoProjectValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),
    body("role")
      .notEmpty()
      .withMessage("Role is required")
      .isIn(AvailableUserRole)
      .withMessage("Role is invalid"),
  ];
};

const createTaskValidator = () => {
  return [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("description").optional().trim(),
    body("assignedTo")
      .optional()
      .isMongoId()
      .withMessage("Assigned user is invalid"),
    body("status")
      .optional()
      .isIn(AvailableTaskStatues)
      .withMessage("Status is invalid"),
  ];
};

const updateTaskValidator = () => {
  return [
    body("title").optional().trim().notEmpty().withMessage("Title is invalid"),
    body("description").optional().trim(),
    body("assignedTo")
      .optional({ values: "falsy" })
      .isMongoId()
      .withMessage("Assigned user is invalid"),
    body("status")
      .optional()
      .isIn(AvailableTaskStatues)
      .withMessage("Status is invalid"),
  ];
};

const createSubTaskValidator = () => {
  return [body("title").trim().notEmpty().withMessage("Title is required")];
};

const updateSubTaskValidator = () => {
  return [
    body("title").optional().trim().notEmpty().withMessage("Title is invalid"),
    body("isCompleted")
      .optional()
      .isBoolean()
      .withMessage("isCompleted must be boolean")
      .toBoolean(),
  ];
};

const createProjectNoteValidator = () => {
  return [
    body("content").trim().notEmpty().withMessage("Content is required"),
  ];
};

const updateProjectNoteValidator = () => {
  return [
    body("content").trim().notEmpty().withMessage("Content is required"),
  ];
};

const processJoinRequestValidator = () => {
  return [
    body("action")
      .trim()
      .notEmpty()
      .withMessage("Action is required")
      .isIn(["approve", "reject"])
      .withMessage("Action must be approve or reject"),
  ];
};

export {
  userRegisterValidator,
  userLoginValidator,
  userChangeCurrentPasswordValidator,
  userForgotPasswordValidator,
  userResetForgotPasswordValidator,
  createProjectValidator,
  addMembertoProjectValidator,
  createTaskValidator,
  updateTaskValidator,
  createSubTaskValidator,
  updateSubTaskValidator,
  createProjectNoteValidator,
  updateProjectNoteValidator,
  processJoinRequestValidator,
};
