import mongoose from "mongoose";

export const connectTestDB = async () => {
  await mongoose.connect(process.env.MONGO_TEST);
};

export const clearTestDB = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

export const closeTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
};
