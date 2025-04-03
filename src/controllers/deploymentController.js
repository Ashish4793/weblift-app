import { EC2Client, RunInstancesCommand, DescribeInstancesCommand } from '@aws-sdk/client-ec2';
import { SSMClient, SendCommandCommand } from '@aws-sdk/client-ssm';
import { PrismaClient } from "@prisma/client";
import { customAlphabet } from 'nanoid';
import { getRepoDetails } from '../utils/githubFunctions.js';
import createSubdomain from '../utils/cloudFlare.js';

const prisma = new PrismaClient();

const REGION = 'ap-south-1';
const AMI_ID = 'ami-07ccd5b62d2233ddb';
const SECURITY_GROUP_ID = 'sg-0b34e34d59a58cb23';

const nanoid7 = customAlphabet('1234567890ABCDEF', 7); 
const nanoid12 = customAlphabet('1234567890ABCDEFGH', 12);

// Initialize EC2 and SSM clients
const ec2Client = new EC2Client({
    region: REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const ssmClient = new SSMClient({
    region: REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

export const deploymentInitiate = async (req, res) => {
    try {
        const { projectName , githubRepo, customRepoUrl, installCommand, branchName , framework, rootDirectory, buildCommand, machineType, startCommand, envVariables } = req.body;
        const startDirectory = 'cd app'
        // Use githubRepo if customRepo is empty
        const repoUrl = customRepoUrl.trim() ? customRepoUrl : githubRepo.trim();
    
        const projectSubD = projectName.toLowerCase();
        const appPort = req.body.portNumber;

        if (!repoUrl) {
          return res.status(400).render('404');
        }

        const redisHost= process.env.REDIS_HOST;
        const redisPort= process.env.REDIS_PORT;
        const redisPassword= process.env.REDIS_PASSWORD;

        // Step 1: Launch EC2 instance without specifying a key pair
        // const INSTANCE_TYPE = 't2.micro';
        const INSTANCE_TYPE = machineType;

        const instanceParams = {
            ImageId: AMI_ID,  // Your pre-baked AMI ID
            InstanceType: INSTANCE_TYPE,
            SecurityGroupIds: [SECURITY_GROUP_ID],
            MinCount: 1,
            MaxCount: 1,
            IamInstanceProfile: { Name: "AmazonEC2RoleforSSM" },
            TagSpecifications: [{
                ResourceType: 'instance',
                Tags: [
                    { Key: 'Project', Value: 'DynamicDeployment' },
                    { Key: 'Name', Value:  projectName}
                ]
            }],
            UserData: Buffer.from(`#!/bin/bash
                exec > /home/ec2-user/userdata.log 2>&1
                set -x  # Enable debug mode
                
                # Define Redis credentials
                REDIS_HOST="${redisHost}"
                REDIS_PORT="${redisPort}"
                REDIS_AUTH="${redisPassword}"
                
                # Clone repo
                sudo git clone ${repoUrl} /home/ec2-user/app
                cd /home/ec2-user/app/${rootDirectory}
                touch /home/ec2-user/app/logs.log  
                
                # Start streaming logs in the background
                tail -f /home/ec2-user/app/logs.log | while read line; do
                    redis-cli --tls -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_AUTH" PUBLISH "${projectName}" "$line"
                done &
                
                # Logging function
                log_message() {
                   echo "$1" | tee -a /home/ec2-user/app/logs.log
                }                      

                
                log_message "Initializing deployment..."
                log_message "Cloning ${repoUrl} repository..."
                log_message "Repository cloned."
                
                log_message "Setting environment variables..."
                echo "${envVariables}" | sudo tee /home/ec2-user/app/.env > /dev/null
                
                log_message "Ensuring correct permissions..."
                sudo chown -R ec2-user:ec2-user /home/ec2-user/app
                
                log_message "Installing dependencies..."
                log_message "Running ${installCommand}..."
                sudo -u ec2-user bash -c "${installCommand}" >> /home/ec2-user/app/logs.log 2>&1
                
                log_message "Running build command..."
                sudo -u ec2-user bash -c "${buildCommand}" >> /home/ec2-user/app/logs.log 2>&1
                
                log_message "Starting application..."
                sudo -u ec2-user bash -c "${startDirectory}" >> /home/ec2-user/app/logs.log 2>&1
                nohup sudo -u ec2-user bash -c "${startCommand}" >> /home/ec2-user/app/logs.log 2>&1 &
                
                # Create NGINX configuration
                log_message "Setting up Domain configuration..."

                echo "server {
                  listen 80;
                  listen 443 ssl;
                  server_name ${projectSubD}.weblift.live;

                  ssl_certificate /etc/ssl/certs/cloudflare-origin.pem;
                  ssl_certificate_key /etc/ssl/private/cloudflare-origin.key;

                  location / {
                    proxy_pass http://127.0.0.1:${appPort};
                    proxy_set_header Host \\$host;
                    proxy_set_header X-Real-IP \\$remote_addr;
                    proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
                  } 
                }" | sudo tee /etc/nginx/conf.d/${projectSubD}.conf > /dev/null
                
                sudo nginx -t && sudo systemctl reload nginx
                log_message "Domain setup completed!"
                
                log_message "Deployment completed successfully!"
                `).toString('base64')   

        };

        async function delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        const instanceCommand = new RunInstancesCommand(instanceParams);
        const instanceData = await ec2Client.send(instanceCommand);
        
        const instanceId = instanceData.Instances[0].InstanceId;
        console.log(`Instance created with ID: ${instanceId}`);

        const describeInstancesCommand = new DescribeInstancesCommand({
            InstanceIds: [instanceId]
        });

        await delay(5000);

        const describeInstancesResponse = await ec2Client.send(describeInstancesCommand);
        const publicIp = describeInstancesResponse.Reservations[0].Instances[0].PublicIpAddress;

        // update subDomain
        const updateSubDomain = await createSubdomain(projectName, publicIp);
        
        const repoDetails = await getRepoDetails(repoUrl , req.user.githubAccessToken);
    
        const project = await prisma.project.create({
            data : {
                projectId : nanoid7(),
                name: projectName,
                framework: framework,
                instanceData : {
                    instanceId : instanceId,
                    instanceIp : publicIp,
                    subdomain : updateSubDomain
                },
                repoMetaData : {
                    repoName : repoDetails.repoName,
                    repoUrl : repoDetails.repoUrl,
                    repoBranch : branchName,
                },
                userId: req.user.id
            }
        });


        const deployment = await prisma.deployment.create({
            data: {
                deploymentId: nanoid12(),
                projectId: project.id,
                commitMetaData : {
                    repoCommitHash : repoDetails.latestCommitSHA,
                    repoLastCommitMsg :  repoDetails.latestCommitMessage
                },
                configMetaData : {
                    installCommand: installCommand,
                    rootDirectory: rootDirectory,
                    buildCommand: buildCommand,
                    startCommand: startCommand,
                    appPortNumber : appPort
                },
                status : 'building'
            }
        });

        return res.redirect(`/deployed/${project.projectId}`);

    } catch (error) {
        console.error('Error creating or setting up EC2 instance:', error);
        res.status(500).render('500');
    }
}


// export const checkDeploymentStatus = async (req,res) => {

// }