export const APP_ENV = process.env.APP_ENV || "production";

export const DB_HOST = process.env.DB_HOST || "";
export const DB_PORT = Number(process.env.DB_PORT || "0");
export const DB_USER = process.env.DB_USER || "";
export const DB_PASSWORD = process.env.DB_PASSWORD || "";
export const DB_NAME = process.env.DB_NAME || "";

export const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET || "";

export const S3_HOST = process.env.S3_HOST || "";
export const S3_PORT = Number(process.env.S3_PORT || "0");
export const S3_REGION = process.env.S3_REGION || "";
export const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || "";
export const S3_SECRET_KEY = process.env.S3_SECRET_KEY || "";
export const S3_BUCKET = process.env.S3_BUCKET || "";
