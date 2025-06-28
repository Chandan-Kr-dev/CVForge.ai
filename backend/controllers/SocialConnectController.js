import gs from "github-scraper";
import SocialsConnect from "../models/social_connect.js";
import { profiles } from "../models/profiles.models.js";

const githubScrapper = async (req, res) => {
  const { githubUsername } = req.query;
  console.log(req.query);
  try {
    var url = `/${githubUsername}`;
    gs(url, function (err, data) {
      console.log(data);
      return res.status(200).json({
        success: true,
        message: "Github data fetched successfully",
        data,
      });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const githubRepo = async (req, res) => {
  const { githubUsername } = req.body;
  try {
    var url = `${githubUsername}?tab=repositories`;
    gs(url, function (err, data) {
      console.log(data);
      return res.status(200).json({
        success: true,
        message: "Github data fetched successfully",
        data,
      });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error:error
    });
  }
};

const githubdata = async (req, res) => {
  const {userId, userName, avatar, bio, followers, following, repos } = req.body;
  console.log(req.body);

  try {
    const newUser = new SocialsConnect({
      userId,
      githubScrapedData: {
        
        userName,
        avatar,
        bio,
        followers,
        following,
        repos,
      },
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: "GitHub user data saved successfully",
      data: newUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const createProfile = async (req, res) => {
  try {
    const {
      userId,
      fullname,
      headline,
      summary,
      experience,
      
      skills,
      certifications,
      education,
      source,
      projects
    } = req.body;

    // Validate required fields
    if (!fullname && !headline) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'At least fullname or headline is required'
      });
    }

    // Create new profile data
    const profileData = {
      user_id:userId||"",
      fullName: fullname || '',
      headline: headline || '',
      summary: summary || '',
      experience: experience || [],
      projects: projects || [],
      education: education || [],
      skills: skills || [],
      certifications: certifications || [],
      source: source || 'Linkedin',
      scraped_at: new Date()
    };

    const newProfile = new profiles(profileData);
    const savedProfile = await newProfile.save();

    return res.status(201).json({
      success: true,
      data: {
        id: savedProfile._id,
        personalInfo: {
          name: savedProfile.FullName,
          title: savedProfile.headline,
          email: '',
          phone: '',
          location: '',
          linkedin: '',
          portfolio: ''
        },
        summary: savedProfile.Summary,
        experience: savedProfile.Experience,
        skills: savedProfile.Skills,
        certifications: savedProfile.Certifications,
        education: savedProfile.Education,
        languages: [],
        projects: savedProfile.Projects,
        source: savedProfile.source,
        scraped_at: savedProfile.scraped_at,
        createdAt: savedProfile.createdAt,
        updatedAt: savedProfile.updatedAt
      },
      error: null , message:"Linkedin Scraped SuccessFully"
    });

  } catch (error) {
    console.error('Error creating profile:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        data: null,
        error: `Validation Error: ${error.message}`
      });
    }

    return res.status(500).json({
      success: false,
      data: null,
      error: 'Internal server error while creating profile'
    });
  }
};

const addprojectstoLinkedin=async (req, res) => {
  const { userId, projects } = req.body;
  try {
    const profile = await profiles.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    profile.projects.push(...projects);
    await profile.save();

    res.json({
      success: true,
      message: "Projects added successfully",
      profile: profile,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
}


const getProfileData=async(req,res)=>{
  const {userId}=req.body
  try {
    const profile=await profiles.findOne({userId});
    res.json({
      success:true,
      message:"profile fetched",
      profile:profile
    })
  } catch (error) {
    console.error(error)
    res.json(error)
  }
}

export { githubScrapper, githubRepo, githubdata, createProfile,getProfileData ,addprojectstoLinkedin};
