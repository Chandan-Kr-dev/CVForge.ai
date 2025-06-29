import mongoose  from "mongoose";


const SocialsConnectSchema = new mongoose.Schema({
   userId: {
      type: String,
      required: true
   },
   fullName: {
         type: String
      },
      headline: {
         type: String
      },
      personalinfo:{
         type: Object,
         properties: {
            email: { type: String },
            phone: { type: String },
            location: { type: String },
            linkedin: { type: String },   
            portfolio: { type: String  }
         }
      },
      
}, { timestamps: true });

const SocialsConnect = mongoose.model("Socials_Connect", SocialsConnectSchema);

export default SocialsConnect;