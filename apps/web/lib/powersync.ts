export interface SyncAdapterStatus {
  configured: boolean;
  mode: "local_mock" | "powersync";
  message: string;
}

export function getPowerSyncStatus(): SyncAdapterStatus {
  const url = process.env.NEXT_PUBLIC_POWERSYNC_URL;

  if (!url || process.env.NEXT_PUBLIC_USE_LOCAL_MOCKS === "true") {
    return {
      configured: false,
      mode: "local_mock",
      message: "Local mock mode is active. Offline workout state is stored in the browser until PowerSync is configured."
    };
  }

  return {
    configured: true,
    mode: "powersync",
    message: "PowerSync URL is configured. Connect the production connector after Supabase setup."
  };
}
