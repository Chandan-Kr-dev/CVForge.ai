import mongoose from "mongoose";

const ProfilesSchema = new mongoose.Schema({
   user_id:{
      type:String
   },
    fullName: {
         type: String
      },
      headline: {
         type: String
      },
      summary: {
         type: String
      },
      experience: {
         type: Array
      },
      projects:{
         type:Array
      },
      education: {
         type: Array
      },
      skills: {
         type: Array
      },
      certifications: {
         type: Array
      },
      source:{
        type:String,
        default:"Linkedin"
      },
      scraped_at:{
        type:Date,
        default:Date.now()
      }
    
},{timestamps:true})

export const profiles=new mongoose.model("profiles",ProfilesSchema)