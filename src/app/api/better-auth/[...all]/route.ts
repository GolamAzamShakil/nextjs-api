import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "../../../../../lib/auth";


export const { GET, POST } = toNextJsHandler(auth);

// Optional: Add additional HTTP methods if needed
//export const { PUT, DELETE, PATCH } = toNextJsHandler(auth);