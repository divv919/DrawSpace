"use client";

import { CreateRoomRequest, CreateRoomResponse } from "@/types/rooms";
import { UseMutationResult } from "@tanstack/react-query";
import { XIcon, LockIcon, UnlockIcon, LoaderIcon } from "lucide-react";
import { Button } from "./ui/Button";

export default function CreateRoomModal({
  onClose,
  formData,
  setFormData,
  onSubmit,
  mutation,
}: {
  onClose: () => void;
  formData: { name: string; password: string; isProtected: boolean };
  setFormData: (data: {
    name: string;
    password: string;
    isProtected: boolean;
  }) => void;
  mutation: UseMutationResult<CreateRoomResponse, Error, CreateRoomRequest>;
  onSubmit: () => void;
}) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !mutation.isPending) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-100">
            Create New Room
          </h2>
          <button
            onClick={onClose}
            disabled={mutation.isPending}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Room Name Input */}
          <div className="space-y-2">
            <label
              htmlFor="room-name"
              className="block text-sm font-medium text-neutral-300"
            >
              Room Name
            </label>
            <input
              id="room-name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              type="text"
              placeholder="Enter room name"
              disabled={mutation.isPending}
              className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-600 focus:border-transparent disabled:opacity-50 transition-all"
            />
          </div>

          {/* Password Protection Toggle */}
          <div className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-lg border border-neutral-700/50">
            <div className="flex items-center gap-3">
              {formData.isProtected ? (
                <LockIcon size={18} className="text-neutral-300" />
              ) : (
                <UnlockIcon size={18} className="text-neutral-500" />
              )}
              <div>
                <p className="text-sm font-medium text-neutral-200">
                  Password Protection
                </p>
                <p className="text-xs text-neutral-500">
                  Require a password to join this room
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formData.isProtected}
              disabled={mutation.isPending}
              onClick={() =>
                setFormData({ ...formData, isProtected: !formData.isProtected })
              }
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                formData.isProtected ? "bg-neutral-200" : "bg-neutral-700"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform ${
                  formData.isProtected
                    ? "translate-x-5 bg-neutral-900"
                    : "translate-x-0 bg-neutral-400"
                }`}
              />
            </button>
          </div>

          {/* Password Input (conditional) */}
          {formData.isProtected && (
            <div className="space-y-2">
              <label
                htmlFor="room-password"
                className="block text-sm font-medium text-neutral-300"
              >
                Room Password
              </label>
              <input
                id="room-password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                type="password"
                placeholder="Enter room password"
                disabled={mutation.isPending}
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-600 focus:border-transparent disabled:opacity-50 transition-all"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-800 bg-neutral-900/50">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={mutation.isPending}
            className="px-4 py-2"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onSubmit}
            disabled={mutation.isPending || !formData.name.trim()}
            className="px-4 py-2 flex items-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <LoaderIcon size={16} className="animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <span>Create Room</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
