'use client';

import { motion } from 'framer-motion';
import { MoreHorizontal, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { Badge } from './Badge';

interface Task {
  id: string;
  title: string;
  project: string;
  rate: string;
  time: string;
  status?: string;
}

interface KanbanColumnProps {
  title: string;
  count: number;
  tasks: Task[];
  accentColor?: string;
  onAddTask?: () => void;
}

export function KanbanColumn({
  title,
  count,
  tasks,
  accentColor = 'bg-gray-1000',
  onAddTask,
}: KanbanColumnProps) {
  return (
    <div className="flex flex-col w-full min-w-[280px] bg-gray-50/50 rounded-2xl p-3 h-full">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className={clsx('w-2.5 h-2.5 rounded-full', accentColor)} />
          <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
          <span className="bg-gray-200 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
        <div className="flex gap-1">
          {onAddTask && (
            <button onClick={onAddTask} className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors">
              <Plus size={16} />
            </button>
          )}
          <button className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
        {tasks.map((task) => (
          <motion.div
            layoutId={`task-${task.id}`}
            key={task.id}
            whileHover={{ y: -2 }}
            className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm cursor-grab active:cursor-grabbing group"
          >
            <div className="flex justify-between items-start mb-2">
              <Badge status="draft" label={task.project} dot={false} className="text-[10px] py-0 px-2" />
              {task.status && <span className="text-[10px] font-medium text-gray-400">{task.status}</span>}
            </div>
            
            <h4 className="font-medium text-gray-900 text-sm mb-3 leading-snug group-hover:text-gray-900 transition-colors">
              {task.title}
            </h4>
            
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
              <span className="text-xs text-gray-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                {task.time}
              </span>
              <span className="text-xs font-bold text-gray-700">{task.rate}</span>
            </div>
          </motion.div>
        ))}

        {tasks.length === 0 && (
          <div className="flex-1 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center min-h-[100px]">
            <p className="text-xs text-gray-400">No tasks</p>
          </div>
        )}
      </div>
    </div>
  );
}
