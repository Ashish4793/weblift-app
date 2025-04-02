//appController.js
import { fetchGithubRepos } from "../utils/githubFunctions.js";
import fetch from "node-fetch";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getHome = (req, res) => {
    try {
        res.render("home");
    } catch (error) {
        console.log(error);
        res.status(500).render('500');
    }
};

export const getSettings = (req, res) => {
    try {
        res.render("settings", { user: req.user });
    } catch (error) {
        console.log(error);
        res.status(500).render('500');
    }
}

export const getHelpCenter = (req, res) => {
    try {
        res.render("help-center", { user: req.user });
    } catch (error) {
        console.log(error);
        res.status(500).render('500');
    }
}

export const getDashboard = async (req, res) => {
    try {
        
        const [totalProjects, projects] = await Promise.all([
            prisma.project.count({
                where: { userId: req.user.id }
            }),
            prisma.project.findMany({
                where: { userId: req.user.id },
                orderBy: { createdAt: 'desc' },
                take: 3
            })
        ]);
        
        const [totalDeployments, deployments] = await Promise.all([
            prisma.deployment.count({
                where: {
                    project: { userId: req.user.id }
                }
            }),
            prisma.deployment.findMany({
                where: {
                    project: { userId: req.user.id }
                },
                include: {
                    project : true
                },
                orderBy: { deployedAt: 'desc' },
                take: 3
            })
        ]);
        

        return res.render("dashboard", { user: req.user , projects , deployments , totalProjects, totalDeployments });
    } catch (error) {
        console.log(error);
        return res.status(500).render('500');
    }
};

export const getNewDeployment = async (req,res) => {
    try {
        const repos = await fetchGithubRepos(req.user.githubAccessToken); 
         
        return res.render('new-deployment', {user: req.user, repos , username: req.user.githubUserName});
    } catch (error) {
        console.log(error);
        return res.status(500).render('500');
    }
}

export const getProjectsList = async (req,res) => {
    try {
        const projects = await prisma.project.findMany({
            where: { userId : req.user.id },
            orderBy: {
                createdAt: 'desc' // Sorting latest deployments first
            }
        });
        
        return res.render('projects-list' , {projects , user : req.user});

    } catch (error) {
        console.log(error);
        res.status(500).render('500');
    }
}


export const getDeploymentsList = async (req,res) => {
    try {
        const deployments = await prisma.deployment.findMany({
            where: {
                project: {
                    userId: req.user.id // Filtering deployments where the project's userId matches the current user
                }
            },
            include: {
                project: true
            },
            orderBy: {
                deployedAt: 'desc' // Sorting latest deployments first
            }
        });        
        
        return res.render('deployments-list' , {deployments , user : req.user});

    } catch (error) {
        console.log(error);
        res.status(500).render('500');
    }
}

export const getProjectById = async (req,res) => {
    try {
        const project = await prisma.project.findUnique({
            where: {
                projectId : req.params.projectId,
                userId: req.user.id 
            },
            include: {
                deployments: true
            },
        }); 
        
        return res.render('project' , {project , user: req.user})
    } catch (error) {
        console.log(error);
        res.status(500).render('500');
    }
}

export const getDeploymentById = async (req,res) => {
    try {
        const deployment = await prisma.deployment.findUnique({
            where: {
                deploymentId : req.params.deploymentId,
                project: {
                    userId: req.user.id // Filtering deployments where the project's userId matches the current user
                }
            },
            include: {
                project: true
            }
        });         
        
        return res.render('deployment' , {deployment , user :req.user})
    } catch (error) {
        console.log(error);
        res.status(500).render('500');
    }
}

export const getProjectDeployedPage = async (req,res) => {
    try {
        const project = await prisma.project.findUnique({
            where: { projectId: req.params.projectId , status : 'building' },
            include: {
                deployments: {
                    take: 1, 
                    orderBy: { deployedAt: "desc" },
                },
            },
        });

        if(!project) {
            return res.redirect(`/project/${req.params.projectId}`);
        }
        
        return res.render('deployed' , {project, user : req.user})
        
    } catch (error) {
        console.log(error);
        return res.status(500).render('500');
    }
}