"use client";

import { useState, useCallback } from "react";
import {
  DndContext, DragEndEvent, DragOverEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCorners,
  DragOverlay, useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, MoreHorizontal, Pencil, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PriorityBadge } from "@/components/tasks/task-badge";
import { TaskForm } from "@/components/tasks/task-form";
import { updateTaskPositions, deleteTask } from "@/actions/tasks";
import { toast } from "sonner";
import { cn, formatDate, getInitials, STATUS_LABELS } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const COLUMNS: { id: string; label: string; dotClass: string }[] = [
  { id: "BACKLOG", label: "Backlog", dotClass: "bg-slate-400" },
  { id: "TODO", label: "To Do", dotClass: "bg-blue-500" },
  { id: "IN_PROGRESS", label: "In Progress", dotClass: "bg-amber-500" },
  { id: "REVIEW", label: "Review", dotClass: "bg-purple-500" },
  { id: "DONE", label: "Done", dotClass: "bg-emerald-500" },
];

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  assigneeId: string | null;
  position: number;
  assignee?: { id: string; name: string | null; image: string | null } | null;
  labels?: { label: { id: string; name: string; color: string } }[];
};

interface KanbanBoardProps {
  tasks: Task[];
  members: { id: string; name: string | null; image: string | null }[];
  projectId: string;
  onRefresh: () => void;
}

export function KanbanBoard({ tasks: initialTasks, members, projectId, onRefresh }: KanbanBoardProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const getColumnTasks = (columnId: string) =>
    tasks.filter((t) => t.status === columnId).sort((a, b) => a.position - b.position);

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    // Check if dropped over a column
    const overIsColumn = COLUMNS.some((c) => c.id === overId);

    if (overIsColumn) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeTaskId ? { ...t, status: overId } : t
        )
      );
    } else {
      // Dropped over another task - find its column
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask && overTask.status !== tasks.find((t) => t.id === activeTaskId)?.status) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === activeTaskId ? { ...t, status: overTask.status } : t
          )
        );
      }
    }
  };

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    const overIsColumn = COLUMNS.some((c) => c.id === overId);
    const overTask = !overIsColumn ? tasks.find((t) => t.id === overId) : null;

    const newStatus = overIsColumn ? overId : (overTask?.status ?? tasks.find((t) => t.id === activeTaskId)?.status ?? "TODO");

    // Reorder within column
    const columnTasks = tasks.filter((t) => t.status === newStatus).sort((a, b) => a.position - b.position);
    const oldIdx = columnTasks.findIndex((t) => t.id === activeTaskId);
    const newIdx = overTask ? columnTasks.findIndex((t) => t.id === overId) : columnTasks.length;

    let reordered = [...columnTasks];
    if (oldIdx !== -1) {
      reordered = arrayMove(reordered, oldIdx, newIdx === -1 ? reordered.length : newIdx);
    }

    const updatedPositions = reordered.map((t, i) => ({
      id: t.id,
      status: newStatus,
      position: i,
    }));

    setTasks((prev) => {
      return [
        ...prev.filter((t) => t.status !== newStatus),
        ...updatedPositions.map((u) => ({ ...prev.find((t) => t.id === u.id)!, ...u })),
      ];
    });

    try {
      await updateTaskPositions(updatedPositions);
    } catch {
      toast.error("Failed to save task order");
      onRefresh();
    }
  }, [tasks, onRefresh]);

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colTasks = getColumnTasks(col.id);
            return (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={colTasks}
                onAdd={() => setAddingToColumn(col.id)}
                onEdit={(task) => setEditingTask(task)}
                onDelete={handleDelete}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="bg-card rounded-lg p-3 border border-primary/30 shadow-xl rotate-1 w-72">
              <p className="text-sm font-medium">{activeTask.title}</p>
              <div className="flex items-center gap-2 mt-2">
                <PriorityBadge priority={activeTask.priority} />
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Add task dialog */}
      <Dialog open={!!addingToColumn} onOpenChange={(o) => !o && setAddingToColumn(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Task to {STATUS_LABELS[addingToColumn ?? ""] ?? addingToColumn}</DialogTitle>
          </DialogHeader>
          {addingToColumn && (
            <TaskForm
              projectId={projectId}
              members={members}
              defaultStatus={addingToColumn}
              onSuccess={() => { setAddingToColumn(null); onRefresh(); }}
              onCancel={() => setAddingToColumn(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit task dialog */}
      <Dialog open={!!editingTask} onOpenChange={(o) => !o && setEditingTask(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Task</DialogTitle></DialogHeader>
          {editingTask && (
            <TaskForm
              projectId={projectId}
              task={editingTask}
              members={members}
              onSuccess={() => { setEditingTask(null); onRefresh(); }}
              onCancel={() => setEditingTask(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function KanbanColumn({ column, tasks, onAdd, onEdit, onDelete }: {
  column: { id: string; label: string; dotClass: string };
  tasks: Task[];
  onAdd: () => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex flex-col shrink-0 w-72">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", column.dotClass)} />
          <span className="text-sm font-medium">{column.label}</span>
          <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 font-medium">
            {tasks.length}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 rounded-xl p-2 min-h-[120px] transition-colors space-y-2",
          isOver ? "bg-accent/50 ring-2 ring-primary/20" : "bg-muted/30"
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && !isOver && (
          <div className="flex items-center justify-center h-16 text-xs text-muted-foreground">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

function SortableTaskCard({ task, onEdit, onDelete }: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card rounded-lg p-3 border border-border shadow-sm group transition-shadow",
        isDragging && "opacity-40"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-medium leading-snug",
            task.status === "DONE" && "line-through text-muted-foreground"
          )}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>
          )}

          {task.labels && task.labels.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {task.labels.map(({ label }) => (
                <span
                  key={label.id}
                  className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ background: label.color + "20", color: label.color }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            <PriorityBadge priority={task.priority} />
            {task.dueDate && (
              <span className="text-[10px] text-muted-foreground">{formatDate(task.dueDate)}</span>
            )}
            {task.assignee && (
              <div className="ml-auto">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={task.assignee.image ?? ""} />
                  <AvatarFallback className="text-[8px]">{getInitials(task.assignee.name)}</AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 rounded flex items-center justify-center hover:bg-muted shrink-0">
              <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(task)} className="gap-2">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-destructive focus:text-destructive"
              onClick={() => onDelete(task.id)}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
