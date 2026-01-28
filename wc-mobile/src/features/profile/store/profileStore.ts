/**
 * Profile Store (Zustand)
 *
 * Manages user profile state with backend API integration.
 */

import { create } from "zustand";
import {
  getProfile as apiGetProfile,
  updateProfile as apiUpdateProfile,
  uploadAvatar as apiUploadAvatar,
  USE_API,
} from "@/api";
import { useAuthStore } from "@/core/store/authStore";

export interface ProfileStats {
  offers: number;
  deals: number;
  rating: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  country: string;
  city: string;
  isVerified: boolean;
  memberSince: string;
  stats: ProfileStats;
}

interface ProfileState {
  profile: UserProfile;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateProfileLocal: (updates: Partial<UserProfile>) => void;
  uploadAvatar: (imageUri: string) => Promise<string | null>;
  resetToGuest: () => void;
  clearError: () => void;
}

const guestProfile: UserProfile = {
  id: "guest",
  name: "Guest",
  email: "",
  phone: "",
  avatar: undefined,
  country: "",
  city: "",
  isVerified: false,
  memberSince: new Date().toISOString(),
  stats: {
    offers: 0,
    deals: 0,
    rating: 0,
  },
};

const mockProfile: UserProfile = {
  id: "u1",
  name: "Mamadou Diallo",
  email: "mamadou.diallo@email.com",
  phone: "+90 532 XXX XX XX",
  avatar: "https://randomuser.me/api/portraits/men/1.jpg",
  country: "TR",
  city: "Istanbul",
  isVerified: true,
  memberSince: "2025-06-15",
  stats: {
    offers: 8,
    deals: 23,
    rating: 4.8,
  },
};

/**
 * Map API profile to local profile model.
 * Handles cases where apiProfile might be undefined or missing fields.
 */
function mapApiProfile(apiProfile: any): UserProfile {
  // Guard against undefined/null apiProfile
  if (!apiProfile) {
    console.warn(
      "[ProfileStore] API profile is undefined, using guest profile",
    );
    return guestProfile;
  }

  return {
    id: apiProfile.id || "",
    name: apiProfile.displayName || apiProfile.name || "User",
    email: apiProfile.email || "",
    phone: apiProfile.phone || "",
    avatar: apiProfile.avatarUrl || apiProfile.avatar,
    country:
      apiProfile.defaultLocation?.country || apiProfile.locationCountry || "",
    city: apiProfile.defaultLocation?.city || apiProfile.locationCity || "",
    isVerified: (apiProfile.trustScore || 0) >= 50,
    memberSince: apiProfile.createdAt || new Date().toISOString(),
    stats: {
      offers: 0, // Will be calculated from offers store
      deals: apiProfile.exchangeCount || apiProfile.totalExchanges || 0,
      rating: apiProfile.trustScore ? apiProfile.trustScore / 20 : 0, // Convert 0-100 to 0-5 scale
    },
  };
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: guestProfile,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  resetToGuest: () => set({ profile: guestProfile }),

  loadProfile: async () => {
    set({ isLoading: true, error: null });
    console.log("[ProfileStore] Loading profile...");

    try {
      if (!USE_API) {
        // Mock mode
        await new Promise((resolve) => setTimeout(resolve, 500));
        set({ profile: mockProfile, isLoading: false });
        console.log("[ProfileStore] Mock profile loaded");
        return;
      }

      // API mode
      const apiProfile = await apiGetProfile();
      console.log(
        "[ProfileStore] API response:",
        JSON.stringify(apiProfile, null, 2),
      );

      // Handle null response (guest users might not have a profile)
      if (!apiProfile) {
        console.log(
          "[ProfileStore] No profile returned from API, keeping current profile",
        );
        set({ isLoading: false });
        return;
      }

      const profile = mapApiProfile(apiProfile);

      // Merge email from auth store (not in profile API response)
      const authUser = useAuthStore.getState().user;
      if (authUser?.email) {
        profile.email = authUser.email;
      }

      set({ profile, isLoading: false });
      console.log(
        "[ProfileStore] API profile loaded:",
        profile.name,
        "country:",
        profile.country,
      );
    } catch (error: any) {
      console.error("[ProfileStore] Failed to load profile:", error);
      // On error, keep the current profile but set error state
      set({
        isLoading: false,
        error: error.message || "Failed to load profile",
      });
    }
  },

  updateProfile: async (updates) => {
    set({ isLoading: true, error: null });
    console.log("[ProfileStore] Updating profile...");

    try {
      if (!USE_API) {
        // Mock mode - update locally
        set((state) => ({
          profile: {
            ...state.profile,
            ...updates,
            stats: updates.stats
              ? { ...state.profile.stats, ...updates.stats }
              : state.profile.stats,
          },
          isLoading: false,
        }));
        console.log("[ProfileStore] Mock profile updated");
        return;
      }

      // API mode - map to API format
      const apiData: any = {};
      if (updates.name) apiData.displayName = updates.name;
      if (updates.phone) apiData.phone = updates.phone;
      if (updates.country || updates.city) {
        apiData.defaultLocation = {
          country: updates.country || get().profile.country,
          city: updates.city || get().profile.city,
        };
      }

      const apiProfile = await apiUpdateProfile(apiData);
      const profile = mapApiProfile(apiProfile);

      set({ profile, isLoading: false });
      console.log("[ProfileStore] API profile updated:", profile.name);
    } catch (error: any) {
      console.error("[ProfileStore] Failed to update profile:", error);
      set({
        isLoading: false,
        error: error.message || "Failed to update profile",
      });
    }
  },

  updateProfileLocal: (updates) =>
    set((state) => ({
      profile: {
        ...state.profile,
        ...updates,
        stats: updates.stats
          ? { ...state.profile.stats, ...updates.stats }
          : state.profile.stats,
      },
    })),

  uploadAvatar: async (imageUri) => {
    set({ isLoading: true, error: null });
    console.log("[ProfileStore] Uploading avatar...");

    try {
      if (!USE_API) {
        // Mock mode - just update locally
        set((state) => ({
          profile: { ...state.profile, avatar: imageUri },
          isLoading: false,
        }));
        console.log("[ProfileStore] Mock avatar updated");
        return imageUri;
      }

      // API mode
      const avatarUrl = await apiUploadAvatar(imageUri);

      set((state) => ({
        profile: { ...state.profile, avatar: avatarUrl },
        isLoading: false,
      }));

      console.log("[ProfileStore] Avatar uploaded:", avatarUrl);
      return avatarUrl;
    } catch (error: any) {
      console.error("[ProfileStore] Failed to upload avatar:", error);
      set({
        isLoading: false,
        error: error.message || "Failed to upload avatar",
      });
      return null;
    }
  },
}));
