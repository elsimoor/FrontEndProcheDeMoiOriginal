"use client";

import { useState, useEffect, useMemo } from "react";
import type React from "react";
import { gql, useQuery, useMutation } from "@apollo/client";
import useTranslation from "@/hooks/useTranslation";
import moment from "moment";
import { Dialog } from "@headlessui/react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
} from "lucide-react";

/**
 * A weekly calendar view for managing staff shifts.  This component
 * displays a grid of seven days (Monday through Sunday) with hourly
 * increments along the vertical axis.  Shifts are rendered as
 * coloured blocks within their corresponding day, sized and
 * positioned according to their start and end times.  Users can
 * navigate between weeks, add new shifts or edit existing ones via
 * modal dialogs.  All data is fetched and persisted via GraphQL
 * queries and mutations.
 */
export default function SalonSchedule() {
  const { t } = useTranslation();
  // Session state: determines which salon (business) the schedule belongs to
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Calendar state: the start of the currently displayed ISO week
  const [weekStart, setWeekStart] = useState(() => moment().startOf("isoWeek"));

  // Modal state for creating/editing a shift
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [modalStartTime, setModalStartTime] = useState<string>("08:00");
  const [modalEndTime, setModalEndTime] = useState<string>("14:00");
  const [modalStaffId, setModalStaffId] = useState<string>("");
  const [modalNotes, setModalNotes] = useState<string>("");

  // Fetch the user session to obtain business context
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/session");
        if (!res.ok) throw new Error("Failed to load session");
        const data = await res.json();
        if (
          data.businessType &&
          data.businessType.toLowerCase() === "salon" &&
          data.businessId
        ) {
          setBusinessId(data.businessId);
          setBusinessType(data.businessType.toLowerCase());
        } else {
          setSessionError("You are not associated with a salon business.");
        }
      } catch (err: any) {
        setSessionError(err.message || "Failed to load session");
      } finally {
        setSessionLoading(false);
      }
    }
    fetchSession();
  }, []);

  // GraphQL definitions
  const GET_STAFF = gql`
    query GetStaff($businessId: ID!, $businessType: String!) {
      staff(businessId: $businessId, businessType: $businessType) {
        id
        name
        role
      }
    }
  `;
  const GET_SHIFTS = gql`
    query GetShifts($businessId: ID!, $businessType: String!, $startDate: Date!, $endDate: Date!) {
      shifts(businessId: $businessId, businessType: $businessType, startDate: $startDate, endDate: $endDate) {
        id
        staffId {
          id
          name
          role
        }
        date
        startTime
        endTime
        notes
      }
    }
  `;
  const CREATE_SHIFT = gql`
    mutation CreateShift($input: ShiftInput!) {
      createShift(input: $input) {
        id
      }
    }
  `;
  const UPDATE_SHIFT = gql`
    mutation UpdateShift($id: ID!, $input: ShiftInput!) {
      updateShift(id: $id, input: $input) {
        id
      }
    }
  `;
  const DELETE_SHIFT = gql`
    mutation DeleteShift($id: ID!) {
      deleteShift(id: $id)
    }
  `;

  // Execute queries
  const {
    data: staffData,
    loading: staffLoading,
    error: staffError,
  } = useQuery(GET_STAFF, {
    variables: { businessId, businessType },
    skip: !businessId || !businessType,
  });
  // Compute start/end of current week for shift query variables
  const weekStartDate = useMemo(() => weekStart.clone().startOf("day"), [weekStart]);
  const weekEndDate = useMemo(() => weekStart.clone().add(6, "day").endOf("day"), [weekStart]);
  const {
    data: shiftsData,
    loading: shiftsLoading,
    error: shiftsError,
    refetch: refetchShifts,
  } = useQuery(GET_SHIFTS, {
    variables: {
      businessId,
      businessType,
      startDate: weekStartDate.toDate(),
      endDate: weekEndDate.toDate(),
    },
    skip: !businessId || !businessType,
  });

  // Mutations
  const [createShift] = useMutation(CREATE_SHIFT, {
    onCompleted: () => refetchShifts(),
  });
  const [updateShift] = useMutation(UPDATE_SHIFT, {
    onCompleted: () => refetchShifts(),
  });
  const [deleteShift] = useMutation(DELETE_SHIFT, {
    onCompleted: () => refetchShifts(),
  });

  // Derived lists
  const staff = staffData?.staff || [];
  const shifts = shiftsData?.shifts || [];

  // Compute array of seven days for the calendar header
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => weekStart.clone().add(i, "day"));
  }, [weekStart]);

  // Times for the left axis (24 hours)
  const times = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const hour = i.toString().padStart(2, "0");
      return `${hour}:00`;
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Interactive selection state
  //
  // To allow managers to "drag" over a range of hours on a given day to
  // create a new shift (similar to the behaviour found in Google Calendar),
  // we track whether the user is currently selecting, which day column they
  // started on, and the Y offsets of the initial mouse down and the current
  // mouse position.  When the mouse is released, the selected range is
  // converted into a start and end time (snapped to the nearest 15 minutes)
  // and the add‑shift modal is opened with those values pre‑filled.
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionDay, setSelectionDay] = useState<Date | null>(null);
  const [selectionStartY, setSelectionStartY] = useState(0);
  const [selectionCurrentY, setSelectionCurrentY] = useState(0);

  // Height of each hour row (must match `rowHeight`) and of the day header
  const headerHeight = 40; // px

  // Convert a vertical offset (in pixels) into a time string (HH:mm).  The
  // offset is relative to the top of the time grid (excluding the header).
  const offsetToTime = (offset: number) => {
    // Clamp offset to the 0–24 hour range
    const clamped = Math.max(0, Math.min(offset, rowHeight * 24));
    const totalMinutes = (clamped / rowHeight) * 60;
    let h = Math.floor(totalMinutes / 60);
    let m = Math.round((totalMinutes % 60) / 15) * 15;
    // Adjust when rounding pushes minutes to 60
    if (m === 60) {
      h += 1;
      m = 0;
    }
    // Normalize hours to 0–23
    if (h >= 24) {
      h = 23;
      m = 45;
    }
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(h)}:${pad(m)}`;
  };

  // Open the add shift modal with explicit start and end offsets.  If the
  // provided offsets are equal (e.g. a click rather than a drag), a default
  // two‑hour duration is used.  Otherwise the times are derived from the
  // offsets.
  const openAddModal = (date: Date, startOffset: number, endOffset: number) => {
    // Ensure startOffset <= endOffset
    let start = Math.min(startOffset, endOffset);
    let end = Math.max(startOffset, endOffset);
    // Snap times to nearest 15 minutes and clamp within day
    const startTime = offsetToTime(start);
    let endTime = offsetToTime(end);
    // If no range selected (click), default to 2 hours
    if (start === end) {
      const [sh, sm] = startTime.split(":" ).map((x) => parseInt(x));
      let endMinutes = sh * 60 + sm + 120;
      const eh = Math.floor(endMinutes / 60);
      const em = endMinutes % 60;
      const pad = (n: number) => n.toString().padStart(2, "0");
      const ehNorm = eh % 24;
      endTime = `${pad(ehNorm)}:${pad(em)}`;
    }
    setEditingShiftId(null);
    setModalDate(date);
    setModalStartTime(startTime);
    setModalEndTime(endTime);
    setModalStaffId(staff.length > 0 ? staff[0].id : "");
    setModalNotes("");
    setIsModalOpen(true);
  };

  // Utility: generate a deterministic colour based on staff name
  function colourForName(name: string) {
    const colours = ["#EC4899", "#F59E0B", "#10B981", "#8B5CF6", "#06B6D4", "#F43F5E"];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colours[Math.abs(hash) % colours.length];
  }

  // Determine the top offset and height for a shift block given start and end times
  const rowHeight = 40; // height in px per hour
  function getOffset(start: string) {
    const [h, m] = start.split(":").map((x) => parseInt(x));
    return ((h * 60 + m) / 60) * rowHeight;
  }
  function getHeight(start: string, end: string) {
    const [sh, sm] = start.split(":").map((x) => parseInt(x));
    const [eh, em] = end.split(":").map((x) => parseInt(x));
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    const diff = Math.max(endMinutes - startMinutes, 30); // minimum 30 minutes height
    return (diff / 60) * rowHeight;
  }

  // Compute layout information for overlapping shifts.  For each day,
  // assign a column index to every shift and derive a left offset and
  // width percentage.  Shifts are sorted by start time.  Columns
  // represent parallel tracks; if a shift can fit into an existing
  // column (no overlap), it uses that column.  Otherwise a new
  // column is created.  All shifts on a given day share the same
  // column count, so narrower events may leave some empty space when
  // concurrency varies.  The resulting layout is stored in a map
  // keyed by shift ID.
  const layoutMap = useMemo(() => {
    const map: Record<string, { leftPercent: number; widthPercent: number }> = {};
    weekDays.forEach((day) => {
      const dayStr = day.format("YYYY-MM-DD");
      const dayEvents = shifts
        .filter((shift: any) => moment(shift.date).format("YYYY-MM-DD") === dayStr)
        .map((shift: any) => {
          const [sh, sm] = shift.startTime.split(":").map((x: string) => parseInt(x));
          const [eh, em] = shift.endTime.split(":").map((x: string) => parseInt(x));
          const startMinutes = sh * 60 + sm;
          const endMinutes = eh * 60 + em;
          return { ...shift, startMinutes, endMinutes };
        })
        .sort((a: any, b: any) => a.startMinutes - b.startMinutes);
      // Assign columns
      const columns: number[] = [];
      dayEvents.forEach((event: any) => {
        let assigned = false;
        for (let i = 0; i < columns.length; i++) {
          if (event.startMinutes >= columns[i]) {
            event.columnIndex = i;
            columns[i] = event.endMinutes;
            assigned = true;
            break;
          }
        }
        if (!assigned) {
          event.columnIndex = columns.length;
          columns.push(event.endMinutes);
        }
      });
      const colCount = columns.length || 1;
      dayEvents.forEach((event: any) => {
        const width = 100 / colCount;
        const left = event.columnIndex * width;
        map[event.id] = { leftPercent: left, widthPercent: width };
      });
    });
    return map;
  }, [shifts, weekDays]);

  // Open modal for new shift on a specific day.  If an offset in pixels is
  // provided (e.g. from a double‑click event), we derive the start time
  // from the vertical position within the column.  The end time is
  // defaulted to two hours after the start.
  const handleAddShift = (date: Date, offsetY?: number) => {
    setEditingShiftId(null);
    setModalDate(date);
    let start = "08:00";
    let end = "14:00";
    if (typeof offsetY === "number") {
      const totalMinutes = (offsetY / rowHeight) * 60;
      const h = Math.floor(totalMinutes / 60);
      const m = Math.round(totalMinutes % 60 / 15) * 15; // snap to nearest 15 min
      const pad = (n: number) => n.toString().padStart(2, "0");
      start = `${pad(h)}:${pad(m)}`;
      // default duration: 2 hours
      let endMinutes = h * 60 + m + 120;
      const endH = Math.floor(endMinutes / 60) % 24;
      const endM = endMinutes % 60;
      end = `${pad(endH)}:${pad(endM)}`;
    }
    setModalStartTime(start);
    setModalEndTime(end);
    setModalStaffId(staff.length > 0 ? staff[0].id : "");
    setModalNotes("");
    setIsModalOpen(true);
  };

  // Open modal to edit an existing shift
  const handleEditShift = (shift: any) => {
    setEditingShiftId(shift.id);
    setModalDate(new Date(shift.date));
    setModalStartTime(shift.startTime);
    setModalEndTime(shift.endTime);
    setModalStaffId(shift.staffId?.id || "");
    setModalNotes(shift.notes || "");
    setIsModalOpen(true);
  };

  // Save shift (create or update)
  const handleSaveShift = async () => {
    if (!businessId || !businessType || !modalDate || !modalStaffId) {
      setIsModalOpen(false);
      return;
    }
    const input = {
      businessId,
      businessType,
      staffId: modalStaffId,
      date: modalDate.toISOString(),
      startTime: modalStartTime,
      endTime: modalEndTime,
      notes: modalNotes || null,
    } as any;
    try {
      if (editingShiftId) {
        await updateShift({ variables: { id: editingShiftId, input } });
      } else {
        await createShift({ variables: { input } });
      }
    } catch (err) {
      console.error("Failed to save shift", err);
    } finally {
      setIsModalOpen(false);
    }
  };

  // Delete shift
  const handleDeleteShift = async () => {
    if (editingShiftId) {
      try {
        await deleteShift({ variables: { id: editingShiftId } });
      } catch (err) {
        console.error("Failed to delete shift", err);
      } finally {
        setIsModalOpen(false);
      }
    }
  };

  // Navigation
  const goPrevWeek = () => {
    setWeekStart((prev) => prev.clone().subtract(1, "week"));
  };
  const goNextWeek = () => {
    setWeekStart((prev) => prev.clone().add(1, "week"));
  };

  if (sessionLoading) {
    return <div>{t("loading") || "Loading..."}</div>;
  }
  if (sessionError) {
    return <div className="text-red-500">{t("failedToLoadSession") || sessionError}</div>;
  }
  if (staffLoading || shiftsLoading) {
    return <div>{t("loading") || "Loading..."}</div>;
  }
  if (staffError || shiftsError) {
    return <div className="text-red-500">{t("failedToLoadData") || "Failed to load data."}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("staffSchedule") || "Staff Schedule"}</h1>
          <p className="text-gray-600">
            {weekStart.format("D MMM") + " - " + weekStart.clone().add(6, "day").format("D MMM YYYY")}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={goPrevWeek}
            className="p-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goNextWeek}
            className="p-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => handleAddShift(weekStart.toDate())}
            className="flex items-center px-3 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("addShift") || "Add Shift"}
          </button>
        </div>
      </div>
      {/* Calendar grid */}
      <div className="overflow-x-auto">
        <div className="grid" style={{ gridTemplateColumns: `80px repeat(7, 1fr)` }}>
          {/* Times column */}
          <div className="border-b border-gray-200" style={{ height: rowHeight * 24 }}>
            {times.map((tVal, idx) => (
              <div
                key={idx}
                className="h-10 border-t border-gray-200 text-xs text-gray-500 flex items-start justify-start pl-1"
                style={{ height: rowHeight }}
              >
                {tVal}
              </div>
            ))}
          </div>
          {/* Day columns */}
          {weekDays.map((day, dayIndex) => {
            // Filter shifts for this day
            const dayDateStr = day.format("YYYY-MM-DD");
            const dayShifts = shifts.filter((shift: any) => {
              return moment(shift.date).format("YYYY-MM-DD") === dayDateStr;
            });
            return (
              <div
                key={dayIndex}
                className="border-l border-gray-200 relative"
                style={{ height: rowHeight * 24 }}
                onMouseDown={(e) => {
                  // Begin selection: record the start Y offset and selected day
                  const offsetY = (e.nativeEvent as any).offsetY - headerHeight;
                  setIsSelecting(true);
                  setSelectionDay(day.toDate());
                  setSelectionStartY(offsetY);
                  setSelectionCurrentY(offsetY);
                }}
                onMouseMove={(e) => {
                  // Update selection while dragging
                  if (!isSelecting) return;
                  // Only update if moving within the same day column
                  if (!selectionDay || !moment(selectionDay).isSame(day.toDate(), 'day')) return;
                  const offsetY = (e.nativeEvent as any).offsetY - headerHeight;
                  setSelectionCurrentY(offsetY);
                }}
                onMouseUp={(e) => {
                  // Finish selection and open modal
                  if (!isSelecting) return;
                  const offsetY = (e.nativeEvent as any).offsetY - headerHeight;
                  const date = day.toDate();
                  const startOffset = selectionStartY;
                  const endOffset = offsetY;
                  setIsSelecting(false);
                  setSelectionDay(null);
                  setSelectionStartY(0);
                  setSelectionCurrentY(0);
                  openAddModal(date, startOffset, endOffset);
                }}
                onDoubleClick={(e) => {
                  // Allow double click to add a default 2‑hour shift at clicked time
                  const offsetY = (e.nativeEvent as any).offsetY - headerHeight;
                  handleAddShift(day.toDate(), offsetY);
                }}
              >
                {/* Selection highlight overlay */}
                {isSelecting && selectionDay &&
                  moment(selectionDay).isSame(day.toDate(), 'day') && (
                    <div
                      className="absolute left-0 right-0 bg-pink-300 opacity-40 z-10 pointer-events-none"
                      style={{
                        top: Math.min(selectionStartY, selectionCurrentY),
                        height: Math.abs(selectionCurrentY - selectionStartY),
                      }}
                    >
                      {/* Display selected time range within the highlight */}
                      <div
                        className="absolute left-1 top-0 text-[10px] font-medium text-gray-700"
                        style={{
                          transform: 'translateY(-100%)',
                        }}
                      >
                        {offsetToTime(Math.min(selectionStartY, selectionCurrentY))}
                        {" - "}
                        {offsetToTime(Math.max(selectionStartY, selectionCurrentY))}
                      </div>
                    </div>
                  )}
                {/* Day header */}
                <div className="sticky top-0 bg-white z-20 text-center py-1 border-b border-gray-200">
                  <div className="text-sm font-semibold text-gray-700">
                    {day.format("ddd")}
                  </div>
                  <div className="text-xs text-gray-500">
                    {day.format("D/M")}
                  </div>
                </div>
                {/* Shift blocks */}
                {dayShifts.map((shift: any) => {
                  const top = getOffset(shift.startTime);
                  const height = getHeight(shift.startTime, shift.endTime);
                  const staffName = shift.staffId?.name || "";
                  const colour = colourForName(staffName);
                  const layout = layoutMap[shift.id] || { leftPercent: 0, widthPercent: 100 };
                  const style: React.CSSProperties = {
                    top,
                    height,
                    left: `${layout.leftPercent}%`,
                    width: `calc(${layout.widthPercent}% - 4px)`,
                    backgroundColor: colour,
                  };
                  return (
                    <div
                      key={shift.id}
                      onClick={() => handleEditShift(shift)}
                      className="absolute p-1 rounded-md text-xs text-white shadow cursor-pointer"
                      style={style}
                    >
                      <div className="font-semibold truncate">{staffName}</div>
                      <div className="text-[10px]">
                        {shift.startTime} - {shift.endTime}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      {/* Modal for add/edit shift */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto"
      >
        <div className="flex min-h-screen items-center justify-center p-4 text-center">
          {/* Overlay */}
          <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
          {/* Panel */}
          <Dialog.Panel className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                {editingShiftId
                  ? t("editShift") || "Edit Shift"
                  : t("addShift") || "Add Shift"}
              </Dialog.Title>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 text-left">
              {/* Date */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  {t("dateLabelColumn") || "Date"}
                </label>
                <input
                  type="date"
                  value={modalDate ? moment(modalDate).format("YYYY-MM-DD") : ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setModalDate(value ? new Date(value) : null);
                  }}
                  className="border border-gray-300 rounded-md p-2"
                />
              </div>
              {/* Staff selection */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  {t("staffLabel") || "Staff"}
                </label>
                <select
                  value={modalStaffId}
                  onChange={(e) => setModalStaffId(e.target.value)}
                  className="border border-gray-300 rounded-md p-2"
                >
                  {staff.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Start time */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  {t("startTime") || "Start Time"}
                </label>
                <input
                  type="time"
                  value={modalStartTime}
                  onChange={(e) => setModalStartTime(e.target.value)}
                  className="border border-gray-300 rounded-md p-2"
                />
              </div>
              {/* End time */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  {t("endTime") || "End Time"}
                </label>
                <input
                  type="time"
                  value={modalEndTime}
                  onChange={(e) => setModalEndTime(e.target.value)}
                  className="border border-gray-300 rounded-md p-2"
                />
              </div>
              {/* Notes */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  {t("notes") || "Notes"}
                </label>
                <textarea
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="border border-gray-300 rounded-md p-2"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                {editingShiftId && (
                  <button
                    type="button"
                    onClick={handleDeleteShift}
                    className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    {t("delete") || "Delete"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveShift}
                  className="px-3 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
                >
                  {t("save") || "Save"}
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}