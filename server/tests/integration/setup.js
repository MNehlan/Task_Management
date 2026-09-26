import { beforeAll, afterEach } from "vitest";

import {
  connectTestDB,
  clearTestDB,
} from "../../config/testDb.js";

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});