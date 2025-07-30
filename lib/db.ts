import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI

const connectDB = async() => {
    const connectionState = mongoose.connection.readyState;

    if (connectionState === 1) {
        console.log("Connection Already Established!");
        return;
    }

    if (connectionState === 2) {
        console.log("Connection is ongoing..");
        return;
    }

    /* if (connectionState === ) {
        console.log("");
        return;
    } */

    try {
        mongoose.connect(MONGODB_URI!, {
            dbName: "nextjsApi",
            bufferCommands: true,
        })
        console.log("Connection Established")
    } catch (error: any) {
        console.log("Error Ocurred: ", error)
        throw new Error("Error: ", error)
    } 
}

export default connectDB;