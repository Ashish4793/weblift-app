import fetch from "node-fetch";

export const fetchGitHubEmail = async (accessToken) => {
    const response = await fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `token ${accessToken}` },
    });

    if (!response.ok) {
        console.error("Failed to fetch GitHub emails:", response.statusText);
        return null;
    }

    const emails = await response.json();
    const primaryEmail = emails.find(email => email.primary && email.verified);
    return primaryEmail ? primaryEmail.email : null;
};

export const fetchGithubRepos = async (accessToken) => {
    try {
        let repos = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
            const response = await fetch(`https://api.github.com/user/repos?per_page=100&page=${page}`, {
                headers: {
                    Authorization: `token ${accessToken}`,
                    Accept: "application/vnd.github.v3+json"
                }
            });

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.statusText}`);
            }

            const data = await response.json();
            repos = repos.concat(data);

            // If the returned data length is less than 100, no more pages exist
            hasMore = data.length === 100;
            page++;
        }

        return repos.filter(repo => !repo.private); // Filter out private repos
    } catch (error) {
        console.error("Error fetching GitHub repositories:", error.message);
        return [];
    }
};


export const getRepoDetails = async (repoUrl, accessToken = null) => {
    try {
        // Normalize URL by removing .git (if present) and extracting owner/repo
        const cleanedUrl = repoUrl.replace(/\.git$/, "").replace("https://github.com/", "");
        
        const [owner, repo] = cleanedUrl.split("/");

        if (!owner || !repo) throw new Error("Invalid repository URL");

        // API URLs
        const repoInfoUrl = `https://api.github.com/repos/${owner}/${repo}`;
        const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/commits`;

        // Headers (optional: if accessToken is provided, use it)
        const headers = accessToken ? { Authorization: `token ${accessToken}` } : {};

        // Fetch repository info
        const repoInfo = await fetch(repoInfoUrl, { headers }).then(res => res.json());
        if (repoInfo.message) throw new Error(repoInfo.message); // Handle API errors

        // Fetch latest commit
        const commitData = await fetch(commitsUrl, { headers }).then(res => res.json());
        if (!commitData.length) throw new Error("No commits found");

        return {
            repoName: repo,
            repoUrl : cleanedUrl,
            latestCommitMessage: commitData[0].commit.message || "No commit message",
            latestCommitSHA: commitData[0].sha.substring(0, 7) || "Unknown SHA" // Get the short 7-character commit hash
        };
    } catch (error) {
        console.error("Error fetching repository details:", error.message);
        return { repoName: null, latestCommitMessage: null, latestCommitSHA: null };
    }
};
