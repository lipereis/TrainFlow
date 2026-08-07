import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.trainflow.app",
  appName: "TrainFlow",
  webDir: "www",
  server: {
    url: "https://trainflow-chi.vercel.app",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
