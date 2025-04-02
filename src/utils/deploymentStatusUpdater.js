import { PrismaClient } from '@prisma/client';
import { checkDomainHealth , updateDeploymentStatus , updateProjectStatus } from './utils.js'
const prisma = new PrismaClient();


// ✅ Main function to check and update statuses
export const checkAndUpdateDeployments = async () => {
  try {
    console.log('ran cron');
    
    const deployments = await prisma.deployment.findMany({
      where: { status: "building" },
      include: { project: { select: { projectId : true, instanceData: true } } },
    });

    const now = new Date();

    for (const deployment of deployments) {
      const domain = `https://${deployment.project.instanceData.subdomain}`;
      const isUp = await checkDomainHealth(domain);      

      if (isUp) {
        console.log(`✅ Deployment ${deployment.deploymentId} is live. Updating statuses...`);
        await updateDeploymentStatus(deployment.deploymentId, "success");
        await updateProjectStatus(deployment.project.projectId, "live");
      } else {
        // Check if deployment has been failing for more than 10 minutes
        const createdAt = new Date(deployment.deployedAt);
        const diffInMinutes = (now - createdAt) / 60000;

        if (diffInMinutes >= 10) {
          console.log(`❌ Deployment ${deployment.deploymentId} has failed. Marking as "failed".`);
          await updateDeploymentStatus(deployment.deploymentId, "failed");
          await updateProjectStatus(deployment.project.projectId, "error");
        } else {
          console.log(`⏳ Deployment ${deployment.deploymentId} is still building.`);
        }
      }
    }

    console.log('ended cron');
    
  } catch (error) {
    console.error("Error checking deployments:", error);
  }
};

