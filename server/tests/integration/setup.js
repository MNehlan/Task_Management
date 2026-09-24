import { beforeAll, afterEach, afterAll } from "vitest";

import {
  connectTestDB,
  clearTestDB,
  closeTestDB,
} from "../../config/testDb.js";

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});
