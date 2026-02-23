import "dotenv/config";
import { createApp } from "./app.ts";
import { connectDB } from "./config/db.ts";

const PORT = process.env.PORT || 5000;

await connectDB(process.env.MONGODB_URI);

const app = createApp();
app.listen(PORT, () => console.log(`[server] listening on ${PORT}`));
