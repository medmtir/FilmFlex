"use client";

import React, { useState } from "react";
import { Profile, UserAccount } from "@/types";
import { Lock, Plus, Check, Edit2, ShieldAlert } from "lucide-react";
import FilmFlexLogo from "./FilmFlexLogo";

interface ProfileGateProps {
  user: UserAccount;
  onSelectProfile: (profile: Profile) => void;
  onUpdateProfiles: (profiles: Profile[]) => void;
}

export default function ProfileGate({
  user,
  onSelectProfile,
  onUpdateProfiles,
}: ProfileGateProps) {
  const [selectedProfileForPin, setSelectedProfileForPin] = useState<Profile | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");

  const handleProfileClick = (profile: Profile) => {
    if (isEditing) {
      setEditingProfile(profile);
      setNewName(profile.name);
      setNewPin(profile.pinCode || "");
      return;
    }

    if (profile.pinCode && profile.pinCode.trim().length > 0) {
      setSelectedProfileForPin(profile);
      setPinInput("");
      setPinError(false);
    } else {
      onSelectProfile(profile);
    }
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileForPin) return;

    if (pinInput === selectedProfileForPin.pinCode) {
      onSelectProfile(selectedProfileForPin);
      setSelectedProfileForPin(null);
    } else {
      setPinError(true);
      setPinInput("");
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;

    const updated = user.profiles.map((p) =>
      p.id === editingProfile.id
        ? {
            ...p,
            name: newName.trim() || p.name,
            pinCode: newPin.trim(),
          }
        : p
    );

    onUpdateProfiles(updated);
    setEditingProfile(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#141414] flex flex-col items-center justify-center p-4 select-none">
      {/* Top Header */}
      <div className="absolute top-8 left-8">
        <FilmFlexLogo size="lg" />
      </div>

      {/* Main Who's Watching Container */}
      {!selectedProfileForPin && !editingProfile && (
        <div className="flex flex-col items-center max-w-4xl w-full animate-fade-in">
          <h1 className="text-3xl md:text-5xl font-medium text-white mb-8 md:mb-12 tracking-wide text-center">
            {isEditing ? "Manage Profiles" : "Who's Watching?"}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 mb-12">
            {user.profiles.map((profile) => (
              <div
                key={profile.id}
                onClick={() => handleProfileClick(profile)}
                className="group flex flex-col items-center cursor-pointer"
              >
                <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-md overflow-hidden border-2 border-transparent group-hover:border-white transition-all duration-200 shadow-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Lock Indicator if PIN is set */}
                  {profile.pinCode && !isEditing && (
                    <div className="absolute bottom-2 right-2 bg-black/80 rounded-full p-1.5 text-white/90">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Edit overlay */}
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Edit2 className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-neutral-400 group-hover:text-white transition-colors">
                  <span className="text-base md:text-lg font-normal tracking-wide">
                    {profile.name}
                  </span>
                </div>
              </div>
            ))}

            {/* Note on 2 Profiles Limit */}
            {user.profiles.length < 2 && (
              <div className="flex flex-col items-center text-neutral-500 cursor-not-allowed">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-md border-2 border-dashed border-neutral-700 flex items-center justify-center">
                  <Plus className="w-10 h-10 text-neutral-600" />
                </div>
                <span className="mt-3 text-sm">Add Profile</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-6 py-2 border border-neutral-500 hover:border-white text-neutral-400 hover:text-white uppercase tracking-widest text-sm transition-colors rounded-sm"
          >
            {isEditing ? "Done" : "Manage Profiles"}
          </button>
        </div>
      )}

      {/* PIN Verification Modal */}
      {selectedProfileForPin && (
        <div className="flex flex-col items-center max-w-md w-full animate-scale-up bg-[#181818] p-8 rounded-lg border border-neutral-800 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4 text-[#E50914]">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 text-center">
            Profile Locked
          </h2>
          <p className="text-neutral-400 text-sm mb-6 text-center">
            Enter the 4-digit PIN to access <span className="text-white font-medium">{selectedProfileForPin.name}</span>
          </p>

          <form onSubmit={handleVerifyPin} className="w-full flex flex-col items-center">
            <input
              type="password"
              maxLength={4}
              autoFocus
              value={pinInput}
              onChange={(e) => {
                setPinError(false);
                setPinInput(e.target.value.replace(/\D/g, ""));
              }}
              placeholder="••••"
              className="w-40 text-center tracking-[1em] text-3xl font-mono py-3 px-4 bg-neutral-900 border border-neutral-700 focus:border-[#E50914] text-white rounded outline-none mb-4"
            />

            {pinError && (
              <div className="flex items-center gap-1.5 text-red-500 text-sm mb-4 animate-shake">
                <ShieldAlert className="w-4 h-4" />
                <span>Incorrect PIN code. Try again.</span>
              </div>
            )}

            <div className="flex gap-3 w-full mt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedProfileForPin(null);
                  setPinInput("");
                  setPinError(false);
                }}
                className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pinInput.length !== 4}
                className="flex-1 py-2.5 bg-[#E50914] hover:bg-[#b81d24] disabled:opacity-50 text-white font-medium rounded text-sm transition-colors"
              >
                Unlock
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Profile / Set PIN Modal */}
      {editingProfile && (
        <div className="flex flex-col items-center max-w-md w-full animate-scale-up bg-[#181818] p-8 rounded-lg border border-neutral-800 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Edit Profile
          </h2>

          <div className="w-24 h-24 rounded-md overflow-hidden mb-6 border-2 border-neutral-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={editingProfile.avatar}
              alt={editingProfile.name}
              className="w-full h-full object-cover"
            />
          </div>

          <form onSubmit={handleSaveProfile} className="w-full space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1">
                Profile Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full py-2.5 px-3 bg-neutral-900 border border-neutral-700 focus:border-white text-white rounded outline-none"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1">
                4-Digit PIN Code (Optional)
              </label>
              <input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                placeholder="Leave blank for no password"
                className="w-full py-2.5 px-3 bg-neutral-900 border border-neutral-700 focus:border-white text-white rounded outline-none text-sm"
              />
              <p className="text-neutral-500 text-xs mt-1">
                Set a 4-digit code to lock your profile and keep your watch history private.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setEditingProfile(null)}
                className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#E50914] hover:bg-[#b81d24] text-white font-medium rounded text-sm transition-colors"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
