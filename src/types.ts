export type NoteColor =
  | "yellow"
  | "pink"
  | "blue"
  | "green"
  | "purple"
  | "orange";

export interface Note {
  id: string;
  content: string;
  color: NoteColor;
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
}

export interface AuthUser {
  id: string;
  nickname: string;
  avatarUrl: string;
  email: string | null;
  phone: string | null;
  createdAt: number;
}

export interface AuthProviders {
  local: boolean;
  wechat: boolean;
}

export const NOTE_COLORS: Record<NoteColor, { bg: string; header: string; label: string }> = {
  yellow: { bg: "#fffce8", header: "#ffe066", label: "黄色" },
  green:  { bg: "#ebfbee", header: "#8ce99a", label: "薄荷" },
  pink:   { bg: "#fff0f6", header: "#faa2c1", label: "粉色" },
  purple: { bg: "#f8f0ff", header: "#da77f2", label: "薰衣草" },
  blue:   { bg: "#e7f5ff", header: "#74c0fc", label: "天蓝" },
  orange: { bg: "#f1f3f5", header: "#adb5bd", label: "灰色" },
};
