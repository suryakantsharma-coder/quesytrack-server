import Calibration from "../models/calibration.model.js";
import Gauge from "../models/gauge.model.js";
import Project from "../models/project.model.js";
import mongoose from "mongoose";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { generateNextCustomId } from "../utils/idGenerator.js";
import {
  parsePaginationParams,
  paginateQuery,
  parseSearchParams,
  buildSearchFilter,
} from "../utils/pagination.js";
import { auditLogFromRequest } from "../services/logger.service.js";
import {
  requireCompany,
  addCompanyFilter,
  ensureCompanyAccess,
  stripCompanyFromBody,
} from "../utils/companyIsolation.js";

const createCalibration = asyncHandler(async (req, res) => {
  if (!requireCompany(req, res)) return;
  const body = stripCompanyFromBody(req.body);
  const {
    calibrationId: providedCalibrationId,
    projectId,
    gaugeId,
    calibrationDate,
    calibrationDueDate,
    calibratedBy,
    calibrationType,
    traceability,
    certificateNumber,
    reportLink,
  } = body;

  if (!projectId || !calibrationDate || !calibrationDueDate) {
    return errorResponse(res, 400, "Required calibration fields are missing");
  }

  const calibrationId =
    providedCalibrationId ||
    (await generateNextCustomId(Calibration, "calibrationId", "C"));

  let finalProjectId = projectId;
  if (
    typeof projectId === "string" &&
    !mongoose.Types.ObjectId.isValid(projectId)
  ) {
    const project = await Project.findOne({
      projectId: projectId.trim(),
      company: req.user.company,
    });
    if (!project) {
      return errorResponse(
        res,
        400,
        "Project not found with the provided projectId",
      );
    }
    finalProjectId = project._id;
  }

  const finalGaugeId = gaugeId && gaugeId.trim() !== "" ? gaugeId.trim() : null;
  const attachments =
    req.files?.map((file) => ({
      fileName: file.originalname,
      filePath: file.path,
      fileType: file.mimetype,
      fileSize: file.size,
    })) || [];

  const calibration = await Calibration.create({
    calibrationId,
    projectId: finalProjectId,
    gaugeId: finalGaugeId,
    calibrationDate,
    calibrationDueDate,
    calibratedBy,
    calibrationType,
    traceability,
    certificateNumber,
    reportLink,
    attachments,
    createdBy: req.user?._id,
    company: req.user.company,
  });
  const hasReport = attachments.length > 0;
  auditLogFromRequest(req, {
    actionType: hasReport ? "UPLOAD" : "CREATE",
    entityType: "CALIBRATION",
    entityId: calibration._id.toString(),
    entityName: calibration.calibrationId || calibration._id.toString(),
    title: hasReport ? "Calibration Report Uploaded" : "Calibration Created",
    description: hasReport
      ? `Calibration #${calibration.calibrationId} report added by ${req.user?.name || "User"}.`
      : `Calibration #${calibration.calibrationId} created by ${req.user?.name || "User"}.`,
  });
  return successResponse(res, 201, "Calibration created successfully", {
    calibration,
  });
});

const getCalibrations = asyncHandler(async (req, res) => {
  if (!requireCompany(req, res)) return;
  const paginationParams = parsePaginationParams(req.query);
  let filter = parseSearchParams(req.query, [
    "calibrationId",
    "calibratedBy",
    "certificateNumber",
  ]);
  addCompanyFilter(filter, req);

  if (
    filter.projectId &&
    typeof filter.projectId === "string" &&
    !mongoose.Types.ObjectId.isValid(filter.projectId)
  ) {
    const project = await Project.findOne({
      projectId: filter.projectId.trim(),
      company: req.user.company,
    });
    if (project) filter.projectId = project._id;
    else filter.projectId = new mongoose.Types.ObjectId();
  }

  const populateOptions = [
    { path: "projectId", select: "projectName projectId" },
    { path: "createdBy", select: "name email" },
  ];
  const { data: calibrations, pagination } = await paginateQuery(
    Calibration,
    filter,
    paginationParams,
    populateOptions,
  );

  const companyId = req.user?.company;
  const calibrationsWithGauge = await Promise.all(
    calibrations.map(async (calibration) => {
      const calibrationObj = calibration.toObject();
      if (calibrationObj.gaugeId) {
        const gaugeFilter = { gaugeId: calibrationObj.gaugeId };
        if (companyId) gaugeFilter.company = companyId;
        calibrationObj.gauge =
          await Gauge.findOne(gaugeFilter).select("gaugeName gaugeId");
      } else calibrationObj.gauge = null;
      return calibrationObj;
    }),
  );

  return successResponse(res, 200, "Calibrations retrieved successfully", {
    calibrations: calibrationsWithGauge,
    pagination,
  });
});

const searchCalibrations = asyncHandler(async (req, res) => {
  if (!requireCompany(req, res)) return;
  const paginationParams = parsePaginationParams(req.query);
  let filter = buildSearchFilter(
    req.query,
    ["calibrationId", "calibratedBy", "certificateNumber"],
    {
      dateField: "calibrationDate",
    },
  );
  addCompanyFilter(filter, req);
  if (
    filter.projectId &&
    typeof filter.projectId === "string" &&
    !mongoose.Types.ObjectId.isValid(filter.projectId)
  ) {
    const project = await Project.findOne({
      projectId: filter.projectId.trim(),
      company: req.user.company,
    });
    if (project) filter.projectId = project._id;
    else filter.projectId = new mongoose.Types.ObjectId();
  }
  const populateOptions = [
    { path: "projectId", select: "projectName projectId" },
    { path: "createdBy", select: "name email" },
  ];
  const { data: calibrations, pagination } = await paginateQuery(
    Calibration,
    filter,
    paginationParams,
    populateOptions,
  );
  const companyIdSearch = req.user?.company;
  const calibrationsWithGauge = await Promise.all(
    calibrations.map(async (calibration) => {
      const calibrationObj = calibration.toObject();
      if (calibrationObj.gaugeId) {
        const gaugeFilter = { gaugeId: calibrationObj.gaugeId };
        if (companyIdSearch) gaugeFilter.company = companyIdSearch;
        calibrationObj.gauge =
          await Gauge.findOne(gaugeFilter).select("gaugeName gaugeId");
      } else calibrationObj.gauge = null;
      return calibrationObj;
    }),
  );
  return successResponse(res, 200, "Search successful", {
    data: calibrationsWithGauge,
    pagination,
  });
});

const getCalibrationById = asyncHandler(async (req, res) => {
  const calibration = await Calibration.findById(req.params.id)
    .populate("projectId", "projectName projectId")
    .populate("createdBy", "name email");
  if (!calibration) return errorResponse(res, 404, "Calibration not found");
  if (!ensureCompanyAccess(req, res, calibration)) return;

  const calibrationObj = calibration.toObject();
  if (calibrationObj.gaugeId) {
    const gaugeFilter = { gaugeId: calibrationObj.gaugeId };
    if (req.user?.company) gaugeFilter.company = req.user.company;
    calibrationObj.gauge =
      await Gauge.findOne(gaugeFilter).select("gaugeName gaugeId");
  } else calibrationObj.gauge = null;

  return successResponse(res, 200, "Calibration retrieved successfully", {
    calibration: calibrationObj,
  });
});

function parseAttachmentsFromBody(body) {
  const raw = body?.attachments;
  if (raw === undefined || raw === null) return null;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

function normalizeAttachmentEntry(item) {
  if (!item || typeof item !== "object") return null;
  return {
    fileName: item.fileName || "",
    filePath: item.filePath || "",
    fileType: item.fileType || "",
    fileSize: typeof item.fileSize === "number" ? item.fileSize : 0,
  };
}

const updateCalibration = asyncHandler(async (req, res) => {
  const calibration = await Calibration.findById(req.params.id);
  if (!calibration) return errorResponse(res, 404, "Calibration not found");
  if (!ensureCompanyAccess(req, res, calibration)) return;

  const body = stripCompanyFromBody(req.body);
  if (body.gaugeId !== undefined) {
    body.gaugeId =
      body.gaugeId && body.gaugeId.trim() !== "" ? body.gaugeId.trim() : null;
  }
  if (
    body.projectId &&
    typeof body.projectId === "string" &&
    !mongoose.Types.ObjectId.isValid(body.projectId)
  ) {
    const project = await Project.findOne({
      projectId: body.projectId.trim(),
      company: req.user.company,
    });
    if (!project) {
      return errorResponse(
        res,
        400,
        "Project not found with the provided projectId",
      );
    }
    body.projectId = project._id;
  }

  const newAttachmentsFromBody = parseAttachmentsFromBody(body);
  if (newAttachmentsFromBody !== null) {
    calibration.attachments = newAttachmentsFromBody
      .map(normalizeAttachmentEntry)
      .filter(Boolean);
  }
  delete body.attachments;
  Object.assign(calibration, body);
  if (req.files?.length) {
    calibration.attachments.push(
      ...req.files.map((file) => ({
        fileName: file.originalname,
        filePath: file.path,
        fileType: file.mimetype,
        fileSize: file.size,
      })),
    );
  }
  await calibration.save();
  const hadNewFiles = req.files?.length > 0;
  if (hadNewFiles) {
    auditLogFromRequest(req, {
      actionType: "UPLOAD",
      entityType: "CALIBRATION",
      entityId: calibration._id.toString(),
      entityName: calibration.calibrationId || calibration._id.toString(),
      title: "Calibration Report Uploaded",
      description: `Calibration #${calibration.calibrationId} report added by ${req.user?.name || "User"}.`,
    });
  } else {
    auditLogFromRequest(req, {
      actionType: "UPDATE",
      entityType: "CALIBRATION",
      entityId: calibration._id.toString(),
      entityName: calibration.calibrationId || calibration._id.toString(),
      title: "Calibration Updated",
      description: `Calibration #${calibration.calibrationId} updated by ${req.user?.name || "User"}.`,
    });
  }
  return successResponse(res, 200, "Calibration updated successfully", {
    calibration,
  });
});

const deleteCalibration = asyncHandler(async (req, res) => {
  const calibration = await Calibration.findById(req.params.id);
  if (!calibration) return errorResponse(res, 404, "Calibration not found");
  if (!ensureCompanyAccess(req, res, calibration)) return;
  const entityName = calibration.calibrationId || calibration._id.toString();
  const entityId = calibration._id.toString();
  await calibration.deleteOne();
  auditLogFromRequest(req, {
    actionType: "DELETE",
    entityType: "CALIBRATION",
    entityId,
    entityName,
    title: "Calibration Deleted",
    description: `Calibration #${entityName} deleted by ${req.user?.name || "User"}.`,
  });
  return successResponse(res, 200, "Calibration deleted successfully");
});

export default {
  createCalibration,
  getCalibrations,
  searchCalibrations,
  getCalibrationById,
  updateCalibration,
  deleteCalibration,
};
