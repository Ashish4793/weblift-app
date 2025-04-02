
import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";
const prisma = new PrismaClient();
import crypto from "crypto";

export const checkProjectNameAvailability = async (req, res) => {
    try {
        const { name } = req.query;

        // Validate format (only lowercase and '-')
        if (!/^[a-z-]+$/.test(name)) {
            return res.status(400).json({ error: "Invalid name format. Use lowercase and '-' only." });
        }

        try {
            // Check if project name already exists
            const existingProject = await prisma.project.findUnique({
                where: { name },
            });

            res.json({ available: !existingProject });
        } catch (error) {
            console.error("Error checking project name availability:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).render('500');
    }
}




export const checkDomainHealth = async (domain) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

        const response = await fetch(domain, { signal: controller.signal });

        clearTimeout(timeoutId);

        if (!response.ok) return false;

        // Read the response HTML
        const text = await response.text();

        // Generate a unique hash of the page content
        const hash = crypto.createHash("md5").update(text).digest("hex");

        console.log(hash);
        
        // Example: Default NGINX welcome page hash (you need to generate this manually)
        const defaultNginxHash = "7df3d7cf3358af3f470ac7229387ef94";

        // If the hash matches the NGINX default page, return false
        return hash !== defaultNginxHash;
    } catch {
        return false;
    }
};


// ✅ Function to update deployment status
export const updateDeploymentStatus = async (deploymentId, status) => {
    await prisma.deployment.update({
        where: { deploymentId: deploymentId },
        data: { status },
    });
};

// ✅ Function to update project status
export const updateProjectStatus = async (projectId, status) => {
    await prisma.project.update({
        where: { projectId: projectId },
        data: { status },
    });
};
