import { type UserConfig, defineConfig } from "vite";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import * as process from "process";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// @ts-ignore
import appSettings from "../appsettings.json";
// @ts-ignore
import appSettingsDev from "../appsettings.Development.json";

// Get base folder for certificates.
const baseFolder =
  process.env.APPDATA !== undefined && process.env.APPDATA !== ""
    ? `${process.env.APPDATA}/ASP.NET/https`
    : `${process.env.HOME}/.aspnet/https`;

// Generate the certificate name using the NPM package name
const certificateName = process.env.npm_package_name;

// Define certificate filepath
const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
// Define key filepath
const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

// Export Vite configuration
export default defineConfig(async ({ command }) => {
  if (command === "serve") {
    // Ensure the certificate and key exist
    if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
      // Wait for the certificate to be generated
      await new Promise<void>((resolve) => {
        spawn(
          "dotnet",
          [
            "dev-certs",
            "https",
            "--export-path",
            certFilePath,
            "--format",
            "Pem",
            "--no-password",
          ],
          { stdio: "inherit" },
        ).on("exit", (code: any) => {
          resolve();
          if (code) {
            process.exit(code);
          }
        });
      });
    }
  }

  // Define Vite configuration
  const config: UserConfig = {
    plugins: [tailwindcss(), react()],
    appType: "spa",
    server: {
      port: appSettingsDev.Vite.Server.Port,
      strictPort: true,
      https: {
        cert: certFilePath,
        key: keyFilePath,
      },
      hmr: {
        host: "localhost",
        clientPort: appSettingsDev.Vite.Server.Port,
      },
      proxy: {
        "/api": {
          target: appSettingsDev.Vite.Server.ProxyTarget,
          changeOrigin: true,
          secure: false,
        },
        "/ws": {
          target: appSettingsDev.Vite.Server.ProxyWebSocketTarget,
          changeOrigin: true,
          secure: false,
        },
        "/swagger": {
          target: appSettingsDev.Vite.Server.ProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };

  return config;
});
