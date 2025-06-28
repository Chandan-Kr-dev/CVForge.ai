import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config()

const connectToDB = async () => {
  try {
    const db = await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB:", db.connection.name); 
  }
  catch (error) {
    console.log(error);
  }
}

export default connectToDB