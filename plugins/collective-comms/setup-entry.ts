/**
 * Collective Communications Plugin - Setup Entry Point
 * 
 * Lightweight loading during onboarding without full runtime
 */

import { defineSetupPluginEntry } from "openclaw/plugin-sdk/core";
import { collectiveCommsPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(collectiveCommsPlugin);
