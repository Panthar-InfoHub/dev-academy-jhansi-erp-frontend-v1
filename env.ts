export const BACKEND_SERVER_URL = process.env.NEXT_PUBLIC_BACKEND_SERVER_URL || process.env.BACKEND_SERVER_URL

// School name and other customizable settings
export const SCHOOL_NAME = "Dev Academy"
export const SCHOOL_TAGLINE = "Empowering Education"
export const SCHOOL_LOGO_URL = "/logo.svg" // Path to school logo

// Theme settings
export const PRIMARY_COLOR = "blue" // Can be changed to match school colors
export const SECONDARY_COLOR = "slate"

export const CHECK_IN_LAT = Number(process.env.NEXT_PUBLIC_CHECK_IN_LAT)
export const CHECK_IN_LNG = Number(process.env.NEXT_PUBLIC_CHECK_IN_LNG)
export const CHECK_IN_RADIUS = Number(process.env.NEXT_PUBLIC_CHECK_IN_RADIUS) // in meters