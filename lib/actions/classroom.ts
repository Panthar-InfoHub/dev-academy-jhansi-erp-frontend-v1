"use server";

import { BACKEND_SERVER_URL } from "@/env";
import { parseServerResponse } from "@/lib/utils";
import {
  classroom,
  classSection,
  completeClassDetails,
  completeClassSectionDetails,
  subject,
} from "@/types/classroom";
import {
  completeStudentDetailsWithTimestamp,
} from "@/types/student";
import { revalidatePath } from "next/cache";
import { getCache, setCache, invalidateCache } from "@/lib/cache";

interface newClassroomRequest extends Partial<classroom> {
  name: string;
  isActive: boolean;
}

interface updateClassroomRequest extends Partial<classroom> {
  name: string | undefined;
  isActive: boolean | undefined;
}

export interface classroomStudentDataWithFees {
  id: string;
  studentId: string;
  classroomSectionId: string;
  sessionStart: string;
  sessionEnd: string;
  monthlyFee: number;
  isActive: boolean;
  student: completeStudentDetailsWithTimestamp;
  classSection: {
    id: string;
    name: string;
    isActive: boolean;
  };
  feeDueTotal: number;
  feeCompletelyPaid: boolean;
  lastPaymentDate: string | null;
}

export interface classroomSectionStudentDataWithFees {
  id: string;
  studentId: string;
  classroomSectionId: string;
  sessionStart: string; // ISO string format
  sessionEnd: string; // ISO string format
  monthlyFee: number;
  isActive: boolean;
  student: completeStudentDetailsWithTimestamp;
  feeDueTotal: number;
  feeCompletelyPaid: boolean;
  lastPaymentDate: string | null;
}


// -------------------------------------------------------------------
// POST REQUEST: Create a new classroom (no caching needed)
// -------------------------------------------------------------------
export async function createClassroom(data: newClassroomRequest) {
  console.debug("Creating a new classroom", data);

  try {
    const response = await fetch(`${BACKEND_SERVER_URL}/v1/classroom`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error("Failed to create new classroom. Status:", response.status, errorBody);
      return parseServerResponse({
        status: "ERROR",
        message: errorBody.error || "Failed to create new classroom",
      });
    }

    const responseData = await response.json();
    const classroomData: completeClassDetails = responseData.classRoomData;
    console.debug("New classroom created successfully with details:", classroomData);
    revalidatePath("/dashboard/class");
    return parseServerResponse({
      status: "SUCCESS",
      message: "Classroom Created Successfully",
      data: classroomData,
    });
  } catch (e) {
    console.error("Failed to create new classroom with the following error:", e);
    return parseServerResponse({
      status: "ERROR",
      message: "An unexpected error occurred while creating the classroom",
    });
  }
}

// -------------------------------------------------------------------
// PUT REQUEST: Update an existing classroom with cache invalidation
// -------------------------------------------------------------------
export async function updateClassroom(
  data: Partial<updateClassroomRequest>,
  classroomId: string
) {
  console.debug("Updating classroom", data);

  try {
    const response = await fetch(`${BACKEND_SERVER_URL}/v1/classroom/${classroomId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error("Failed to update classroom. Status:", response.status, errorBody);
      return parseServerResponse({
        status: "ERROR",
        message: errorBody.error || "Failed to update classroom",
      });
    }

    const responseData = await response.json();
    const classroomData: completeClassDetails = responseData.classRoomData;
    console.debug("Classroom updated successfully with details:", responseData);
    // Invalidate the cached details for this classroom
    invalidateCache(`classroom-details-${classroomId}`);
    revalidatePath(`/dashboard/class/${classroomId}`);

    return parseServerResponse({
      status: "SUCCESS",
      message: "Classroom Updated Successfully",
      data: classroomData,
    });
  } catch (e) {
    console.error("Failed to update classroom with the following error:", e);
    return parseServerResponse({
      status: "ERROR",
      message: "An unexpected error occurred while updating the classroom",
    });
  }
}

// -------------------------------------------------------------------
// DELETE REQUEST: Delete a classroom
// -------------------------------------------------------------------
export async function deleteClassroom(classroomId: string) {
  console.debug("Classroom ID to delete:", classroomId);

  try {
    const response = await fetch(`${BACKEND_SERVER_URL}/v1/classroom/${classroomId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error("Failed to delete classroom. Status:", response.status, errorBody);
      return parseServerResponse({
        status: "ERROR",
        message: errorBody.error || "Failed to delete classroom",
      });
    }

    const responseData = await response.json();
    console.debug(
      "Successfully deleted classroom with id:",
      classroomId,
      "with response:",
      responseData
    );
    invalidateCache(`classroom-details-${classroomId}`);
    return parseServerResponse({
      status: "SUCCESS",
      message: "Classroom Deleted Successfully",
    });
  } catch (e) {
    console.error("Failed to delete classroom with the following error:", e);
    return parseServerResponse({
      status: "ERROR",
      message: "An unexpected error occurred while deleting the classroom",
    });
  }
}

// -------------------------------------------------------------------
// GET REQUEST: Get classroom details (alternative endpoint) with caching
// -------------------------------------------------------------------
export async function getClassroomDetails(classroomId: string) {
  console.debug("Fetching classroom details for id:", classroomId);

  if (!classroomId) {
    return parseServerResponse<null>({
      status: "ERROR",
      message: "Classroom ID is required",
      data: null,
    });
  }

  const cacheKey = `classroom-details-full-${classroomId}`;
  const cachedData = getCache<completeClassDetails>(cacheKey);
  if (cachedData) {
    console.debug("Returning cached classroom full details for key:", cacheKey);
    return cachedData;
  }

  try {
    const response = await fetch(`${BACKEND_SERVER_URL}/v1/classroom/${classroomId}`, {
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error("Failed to get classroom details. Status:", response.status, errorBody);
      return parseServerResponse<null>({
        status: "ERROR",
        message: errorBody.error || "Failed to fetch classroom details",
        data: null,
      });
    }

    const responseData = await response.json();
    const classroomDetails: completeClassDetails = responseData.classRoomData;
    // Cache the details for 30 seconds.
    setCache(cacheKey, classroomDetails, 30);
    return classroomDetails;
  } catch (e) {
    console.error("Failed to fetch classroom details with the following error:", e);
    return parseServerResponse<null>({
      status: "ERROR",
      message: "An unexpected error occurred while fetching classroom details",
      data: null,
    });
  }
}

// -------------------------------------------------------------------
// GET REQUEST: Get all classrooms with caching
// -------------------------------------------------------------------
export async function getAllClassrooms(): Promise<completeClassDetails[]> {
  const cacheKey = "all-classrooms";
  const cachedData = getCache<completeClassDetails[]>(cacheKey);
  if (cachedData) {
    console.debug("Returning cached all-classrooms data");
    return cachedData;
  }

  try {
    const response = await fetch(`${BACKEND_SERVER_URL}/v1/classroom`, {
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error("Failed to get all classrooms. Status:", response.status, errorBody);
      return [];
    }

    const responseData = await response.json();
    const allClassrooms: completeClassDetails[] = responseData.classRoomData;
    // Cache for 30 seconds.
    setCache(cacheKey, allClassrooms, 30);
    return allClassrooms;
  } catch (e) {
    console.error("Failed to fetch all classrooms with the following error:", e);
    return [];
  }
}

// -------------------------------------------------------------------
// GET REQUEST: Get classroom students info with caching
// -------------------------------------------------------------------
export async function getClassroomStudentsInfo(
  classroomId: string,
  data: { startPeriod: Date; endPeriod: Date; activeOnly: boolean }
) {
  console.debug("Fetching classroom students info for id:", classroomId);

  if (!classroomId) {
    return parseServerResponse<null>({
      status: "ERROR",
      message: "Classroom ID is required",
      data: null,
    });
  }

  const cacheKey = `classroom-students-${classroomId}-${data.startPeriod.toISOString()}-${data.endPeriod.toISOString()}-${data.activeOnly}`;
  const cachedData = getCache<ReturnType<typeof parseServerResponse>>(cacheKey);
  if (cachedData) {
    console.debug("Returning cached classroom students info for key:", cacheKey);
    return cachedData;
  }

  try {
    const url = new URL(
      `${BACKEND_SERVER_URL}/v1/classroom/${classroomId}/students`
    );
    url.searchParams.append("startPeriod", data.startPeriod.toISOString());
    url.searchParams.append("endPeriod", data.endPeriod.toISOString());
    url.searchParams.append("activeOnly", String(data.activeOnly));

    const response = await fetch(url.toString(), {
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error("Failed to fetch classroom students info. Status:", response.status, errorBody);
      return parseServerResponse<null>({
        status: "ERROR",
        message: errorBody.error || "Failed to fetch classroom students info",
        data: null,
      });
    }

    const responseData = await response.json();
    const students: classroomStudentDataWithFees[] = responseData.students;
    const parsed = parseServerResponse<classroomStudentDataWithFees[]>({
      status: "SUCCESS",
      message: "Fetched Student Data",
      data: students,
    });
    // Cache for 30 seconds.
    setCache(cacheKey, parsed, 30);
    return parsed;
  } catch (e) {
    console.error(
      "Failed to fetch classroom students info with the following error:",
      e
    );
    return parseServerResponse<null>({
      status: "ERROR",
      message: "An unexpected error occurred while fetching students info",
      data: null,
    });
  }
}

/*
*
* Classroom section operations
*
* */

interface newClassSectionRequest extends Partial<classSection> {
  name: string;
  isActive: boolean;
  defaultFee: number; // Must be greater than 0
  subjects: subject[];
}

interface updateClassSectionRequest extends Partial<classSection> {
  name?: string;
  isActive?: boolean;
  defaultFee?: number;
  subjects?: subject[];
}

// -------------------------------------------------------------------
// GET REQUEST: Get all sections of a classroom with caching
// -------------------------------------------------------------------
export async function getAllSectionsOfClassroom(classroomId: string) {
  console.debug("Fetching sections for classroom id:", classroomId);

  if (!classroomId) {
    return [];
  }

  const cacheKey = `classroom-sections-${classroomId}`;
  const cachedData = getCache<completeClassSectionDetails[]>(cacheKey);
  if (cachedData) {
    console.debug("Returning cached classroom sections for key:", cacheKey);
    return cachedData;
  }

  try {
    const response = await fetch(
      `${BACKEND_SERVER_URL}/v1/classroom/${classroomId}/class-section`,
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error("Failed to fetch classroom sections. Status:", response.status, errorBody);
      return [];
    }

    const responseData = await response.json();
    const classSections: completeClassSectionDetails[] = responseData.sections;
    // Cache for 30 seconds.
    setCache(cacheKey, classSections, 30);
    return classSections;
  } catch (e) {
    console.error("Failed to fetch classroom sections with the following error:", e);
    return [];
  }
}

// -------------------------------------------------------------------
// POST REQUEST: Create a new classroom section
// -------------------------------------------------------------------
export async function createClassroomSection(
  classroomId: string,
  data: newClassSectionRequest
) {
  console.debug("Creating new section in classroom:", classroomId, "with data:", data);

  try {
    const response = await fetch(
      `${BACKEND_SERVER_URL}/v1/classroom/${classroomId}/class-section`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error("Failed to create classroom section. Status:", response.status, errorBody);
      return parseServerResponse({
        status: "ERROR",
        message: errorBody.error || "Failed to create classroom section",
      });
    }

    const responseData = await response.json();
    console.debug(
      "Successfully created new section in classroom:",
      classroomId,
      "with response:",
      responseData
    );
    return parseServerResponse({
      status: "SUCCESS",
      message: "Classroom Section Created Successfully",
      data: responseData.classSectionData,
    });
  } catch (e) {
    console.error("Failed to create new section in classroom with the following error:", e);
    return parseServerResponse({
      status: "ERROR",
      message: "An unexpected error occurred while creating the classroom section",
    });
  }
}

// -------------------------------------------------------------------
// PUT REQUEST: Update an existing classroom section with cache invalidation
// -------------------------------------------------------------------
export async function updateClassroomSection(
  classroomId: string,
  classroomSectionId: string,
  data: updateClassSectionRequest
) {
  console.debug(
    "Updating classroom section:",
    classroomSectionId,
    "inside classroom:",
    classroomId,
    "with data:",
    data
  );

  try {
    const response = await fetch(
      `${BACKEND_SERVER_URL}/v1/classroom/${classroomId}/class-section/${classroomSectionId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error("Failed to update classroom section. Status:", response.status, errorBody);
      return parseServerResponse({
        status: "ERROR",
        message: errorBody.error || "Failed to update classroom section",
      });
    }

    const responseData = await response.json();
    console.debug("Successfully updated classroom section with response:", responseData);
    // Invalidate cache for sections of this classroom.
    invalidateCache(`classroom-sections-${classroomId}`);
    revalidatePath(`/dashboard/class/${classroomId}`);
    return parseServerResponse({
      status: "SUCCESS",
      message: "Classroom Section Updated Successfully",
      data: responseData.classSectionData,
    });
  } catch (e) {
    console.error("Failed to update classroom section with the following error:", e);
    return parseServerResponse({
      status: "ERROR",
      message: "An unexpected error occurred while updating the classroom section",
    });
  }
}

// -------------------------------------------------------------------
// DELETE REQUEST: Delete a classroom section with cache invalidation
// -------------------------------------------------------------------
export async function deleteClassroomSection(
  classroomId: string,
  classroomSectionId: string
) {
  console.debug(
    "Deleting classroom section:",
    classroomSectionId,
    "inside classroom:",
    classroomId
  );

  try {
    const response = await fetch(
      `${BACKEND_SERVER_URL}/v1/classroom/${classroomId}/class-section/${classroomSectionId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error("Failed to delete classroom section. Status:", response.status, errorBody);
      return parseServerResponse({
        status: "ERROR",
        message: errorBody.error || "Failed to delete classroom section",
      });
    }

    const responseData = await response.json();
    console.debug(
      "Successfully deleted classroom section with id:",
      classroomSectionId,
      "with response:",
      responseData
    );
    // Invalidate cache for sections of this classroom.
    invalidateCache(`classroom-sections-${classroomId}`);
    revalidatePath(`/dashboard/class/${classroomId}`);
    return parseServerResponse({
      status: "SUCCESS",
      message: "Classroom Section Deleted Successfully",
    });
  } catch (e) {
    console.error("Failed to delete classroom section with the following error:", e);
    return parseServerResponse({
      status: "ERROR",
      message: "An unexpected error occurred while deleting the classroom section",
    });
  }
}

// -------------------------------------------------------------------
// GET REQUEST: Get classroom section students info with caching
// -------------------------------------------------------------------
export async function getClassroomSectionStudentsInfo(
  classroomId: string,
  classroomSectionId: string,
  data: { startPeriod: Date; endPeriod: Date; activeOnly: boolean }
) {
  console.debug(
    "Fetching students info for classroom id:",
    classroomId,
    "and classroom section id:",
    classroomSectionId
  );

  if (!classroomId || !classroomSectionId) {
    return parseServerResponse<null>({
      status: "ERROR",
      message: "Classroom and classroom section IDs are required",
      data: null,
    });
  }

  const cacheKey = `classroom-section-students-${classroomId}-${classroomSectionId}-${data.startPeriod.toISOString()}-${data.endPeriod.toISOString()}-${data.activeOnly}`;
  const cachedData = getCache<ReturnType<typeof parseServerResponse>>(cacheKey);
  if (cachedData) {
    console.debug("Returning cached classroom section students info for key:", cacheKey);
    return cachedData;
  }

  try {
    const url = new URL(
      `${BACKEND_SERVER_URL}/v1/classroom/${classroomId}/class-section/${classroomSectionId}/students`
    );
    url.searchParams.append("startPeriod", data.startPeriod.toISOString());
    url.searchParams.append("endPeriod", data.endPeriod.toISOString());
    url.searchParams.append("activeOnly", String(data.activeOnly));

    const response = await fetch(url.toString(), {
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error("Failed to fetch classroom section students info. Status:", response.status, errorBody);
      return parseServerResponse<null>({
        status: "ERROR",
        message: errorBody.error || "Failed to fetch classroom section students info",
        data: null,
      });
    }

    const responseData = await response.json();
    const students: classroomSectionStudentDataWithFees[] = responseData.students;
    const parsed = parseServerResponse<classroomSectionStudentDataWithFees[]>({
      status: "SUCCESS",
      message: "Fetched Student Data",
      data: students,
    });
    // Cache for 30 seconds.
    setCache(cacheKey, parsed, 30);
    return parsed;
  } catch (e) {
    console.error("Failed to fetch classroom section students info with the following error:", e);
    return parseServerResponse<null>({
      status: "ERROR",
      message: "An unexpected error occurred while fetching student info",
      data: null,
    });
  }
}