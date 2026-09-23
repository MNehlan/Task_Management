import dns from "node:dns/promises";

import app from "./app.js";
import { connectDB } from "./config/db.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const PORT = process.env.PORT;

await connectDB();

app.listen(PORT, () => {
  console.log(`server running on ${PORT}`);
});
