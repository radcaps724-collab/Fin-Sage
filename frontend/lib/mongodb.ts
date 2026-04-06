import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongodbClientPromise: Promise<MongoClient> | undefined;
}

if (!uri) {
  clientPromise = Promise.reject(
    new Error("Missing Mongo URI. Set MONGODB_URI (frontend) or MONGO_URI.")
  );
} else if (process.env.NODE_ENV === "development") {
  if (!global._mongodbClientPromise) {
    client = new MongoClient(uri);
    global._mongodbClientPromise = client.connect();
  }
  clientPromise = global._mongodbClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export { clientPromise };
export default clientPromise;
