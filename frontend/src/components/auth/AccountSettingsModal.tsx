"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { X, User, Lock, Eye, EyeOff, Camera } from "lucide-react";
import { useAuth } from "./AuthContext";
import { useLanguage } from "@/components/providers/LanguageContext";
import { getAuthErrorMessage } from "@/lib/auth/authErrors";

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountSettingsModal({
  isOpen,
  onClose,
}: AccountSettingsModalProps) {
  const { user, updateProfile, updatePassword } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;
    setName(user.name);
    setAvatarPreview(user.avatar ?? null);
    setAvatarFile(null);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setProfileError(null);
    setProfileSuccess(null);
    setPasswordError(null);
    setPasswordSuccess(null);
  }, [isOpen, user]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  if (!user) return null;

  const handleAvatarPick = (file: File | undefined) => {
    if (!file) return;
    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setProfileSuccess(null);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setIsSavingProfile(true);

    try {
      await updateProfile({
        name: name.trim(),
        avatarFile,
      });
      setAvatarFile(null);
      setProfileSuccess(t("profileUpdated"));
    } catch (error) {
      setProfileError(getAuthErrorMessage(error, t));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordError(t("passwordMismatch"));
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(t("authWeakPassword"));
      return;
    }

    setIsSavingPassword(true);

    try {
      await updatePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setPasswordSuccess(t("passwordChanged"));
    } catch (error) {
      setPasswordError(getAuthErrorMessage(error, t));
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-[32px] z-[80]"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="account-settings-title"
              className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-2xl rounded-[32px] shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/50 dark:border-neutral-700/50"
            >
              <motion.div className="sticky top-0 z-10 flex items-center justify-between p-6 pb-4 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-200/80 dark:border-neutral-800/80 rounded-t-[32px]">
                <h2
                  id="account-settings-title"
                  className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 font-serif"
                >
                  {t("accountSettings")}
                </h2>
                <motion.button
                  type="button"
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                  aria-label={t("close")}
                >
                  <X className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                </motion.button>
              </motion.div>

              <motion.div className="p-6 pt-4 space-y-8">
                <form onSubmit={handleProfileSubmit} className="space-y-5">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gradient-to-r from-orange-500 to-red-600 border-4 border-white dark:border-neutral-800 shadow-lg">
                      {avatarPreview ? (
                        <Image
                          src={avatarPreview}
                          alt={name}
                          fill
                          sizes="96px"
                          className="object-cover"
                          unoptimized={avatarPreview.startsWith("blob:")}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <User className="w-10 h-10 text-white" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                        aria-label={t("changeAvatar")}
                      >
                        <Camera className="w-6 h-6 text-white" />
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => handleAvatarPick(e.target.files?.[0])}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400"
                    >
                      {t("changeAvatar")}
                    </button>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
                      {t("avatarHint")}
                    </p>
                  </div>

                  {profileError && (
                    <p
                      role="alert"
                      className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl px-4 py-3"
                    >
                      {profileError}
                    </p>
                  )}
                  {profileSuccess && (
                    <p
                      role="status"
                      className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/50 rounded-2xl px-4 py-3"
                    >
                      {profileSuccess}
                    </p>
                  )}

                  <div className="space-y-2">
                    <label
                      htmlFor="settings-name"
                      className="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
                    >
                      {t("displayName")}
                    </label>
                    <input
                      id="settings-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      minLength={1}
                      maxLength={80}
                      disabled={isSavingProfile}
                      className="w-full px-4 py-3 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:opacity-60"
                    />
                  </div>

                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{user.email}</p>

                  <motion.button
                    type="submit"
                    disabled={isSavingProfile || !name.trim()}
                    whileHover={isSavingProfile ? undefined : { scale: 1.02, y: -2 }}
                    whileTap={isSavingProfile ? undefined : { scale: 0.98 }}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl font-bold shadow-[0_8px_24px_rgba(255,143,67,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSavingProfile ? t("loading") : t("saveChanges")}
                  </motion.button>
                </form>

                <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {t("changePassword")}
                  </h3>

                  {passwordError && (
                    <p
                      role="alert"
                      className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl px-4 py-3"
                    >
                      {passwordError}
                    </p>
                  )}
                  {passwordSuccess && (
                    <p
                      role="status"
                      className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/50 rounded-2xl px-4 py-3"
                    >
                      {passwordSuccess}
                    </p>
                  )}

                  <PasswordField
                    id="settings-current-password"
                    label={t("currentPassword")}
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    show={showCurrentPassword}
                    onToggleShow={() => setShowCurrentPassword((v) => !v)}
                    showLabel={t("showPassword")}
                    hideLabel={t("hidePassword")}
                    disabled={isSavingPassword}
                    autoComplete="current-password"
                  />

                  <PasswordField
                    id="settings-new-password"
                    label={t("newPassword")}
                    value={newPassword}
                    onChange={setNewPassword}
                    show={showNewPassword}
                    onToggleShow={() => setShowNewPassword((v) => !v)}
                    showLabel={t("showPassword")}
                    hideLabel={t("hidePassword")}
                    disabled={isSavingPassword}
                    autoComplete="new-password"
                  />

                  <PasswordField
                    id="settings-confirm-password"
                    label={t("confirmPassword")}
                    value={confirmNewPassword}
                    onChange={setConfirmNewPassword}
                    show={showNewPassword}
                    onToggleShow={() => setShowNewPassword((v) => !v)}
                    showLabel={t("showPassword")}
                    hideLabel={t("hidePassword")}
                    disabled={isSavingPassword}
                    autoComplete="new-password"
                  />

                  <motion.button
                    type="submit"
                    disabled={
                      isSavingPassword ||
                      !currentPassword ||
                      !newPassword ||
                      !confirmNewPassword
                    }
                    whileHover={isSavingPassword ? undefined : { scale: 1.02, y: -2 }}
                    whileTap={isSavingPassword ? undefined : { scale: 0.98 }}
                    className="w-full py-3 border-2 border-orange-500 text-orange-600 dark:text-orange-400 rounded-2xl font-bold hover:bg-orange-50 dark:hover:bg-orange-950/30 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSavingPassword ? t("loading") : t("changePassword")}
                  </motion.button>
                </form>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
  showLabel,
  hideLabel,
  disabled,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggleShow: () => void;
  showLabel: string;
  hideLabel: string;
  disabled: boolean;
  autoComplete: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
        {label}
      </label>
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 dark:text-neutral-400" />
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          minLength={6}
          disabled={disabled}
          autoComplete={autoComplete}
          className="w-full pl-12 pr-12 py-3 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          aria-label={show ? hideLabel : showLabel}
        >
          {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
