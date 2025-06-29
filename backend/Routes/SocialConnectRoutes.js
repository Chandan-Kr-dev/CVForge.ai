import { Router } from "express";
import {  createProfile, getProfileData , addPeronalinfo , getsocialsdata, githubdata, githubRepo, githubScrapper ,addprojectstoLinkedin} from "../controllers/SocialConnectController.js";

const ScrapperRouter=Router()

ScrapperRouter.get("/github",githubScrapper)
ScrapperRouter.get("/github/repos",githubRepo)
ScrapperRouter.post("/linkedin/addproject",addprojectstoLinkedin)
ScrapperRouter.post("/github/data",githubdata)
ScrapperRouter.post("/linkedin/data",createProfile)
ScrapperRouter.post("/linkedin/profile",getProfileData)
ScrapperRouter.post("/linkedin/addpersonalinfo",addPeronalinfo)
ScrapperRouter.post("/linkedin/getsocialsdata",getsocialsdata)




export default ScrapperRouter;