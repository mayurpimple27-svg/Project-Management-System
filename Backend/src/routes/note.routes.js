import { Router } from "express";
import {
  createProjectNote,
  deleteProjectNote,
  getNoteById,
  getProjectNotes,
  updateProjectNote,
} from "../controllers/note.controllers.js";
import {
  validateProjectPermission,
  verifyJWT,
} from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
  createProjectNoteValidator,
  updateProjectNoteValidator,
} from "../validators/index.js";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";

const router = Router();

router.use(verifyJWT);

router
  .route("/:projectId")
  .get(validateProjectPermission(AvailableUserRole), getProjectNotes)
  .post(
    validateProjectPermission([UserRolesEnum.ADMIN]),
    createProjectNoteValidator(),
    validate,
    createProjectNote,
  );

router
  .route("/:projectId/n/:noteId")
  .get(validateProjectPermission(AvailableUserRole), getNoteById)
  .put(
    validateProjectPermission([UserRolesEnum.ADMIN]),
    updateProjectNoteValidator(),
    validate,
    updateProjectNote,
  )
  .delete(validateProjectPermission([UserRolesEnum.ADMIN]), deleteProjectNote);

export default router;
