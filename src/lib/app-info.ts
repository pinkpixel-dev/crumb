/**
 * Single source of truth for anything the UI needs to say about the build.
 * The version comes from package.json so it can never drift from the release.
 */
import pkg from "../../package.json";

export const APP_NAME = "Crumb";
export const APP_VERSION: string = pkg.version;
export const APP_HOMEPAGE = "https://pinkpixel.dev";
