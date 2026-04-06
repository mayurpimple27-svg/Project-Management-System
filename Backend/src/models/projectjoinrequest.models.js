import mongoose, { Schema } from "mongoose";

const ProjectJoinRequestStatusEnum = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

const AvailableProjectJoinRequestStatuses = Object.values(
  ProjectJoinRequestStatusEnum,
);

const projectJoinRequestSchema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: AvailableProjectJoinRequestStatuses,
      default: ProjectJoinRequestStatusEnum.PENDING,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

projectJoinRequestSchema.index(
  { project: 1, requestedBy: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } },
);

export {
  ProjectJoinRequestStatusEnum,
  AvailableProjectJoinRequestStatuses,
};

export const ProjectJoinRequest = mongoose.model(
  "ProjectJoinRequest",
  projectJoinRequestSchema,
);
