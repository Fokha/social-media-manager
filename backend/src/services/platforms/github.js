const BasePlatform = require('./BasePlatform');
const axios = require('axios');

class GitHubService extends BasePlatform {
  constructor(account) {
    super(account);
    this.apiBase = 'https://api.github.com';
    this.username = account.platformUsername;
  }

  async makeRequest(method, endpoint, data = null) {
    const response = await axios({
      method,
      url: `${this.apiBase}${endpoint}`,
      data,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    return response.data;
  }

  async getUser() {
    return this.makeRequest('GET', '/user');
  }

  async getRepositories(page = 1, perPage = 30) {
    return this.makeRequest('GET', `/user/repos?page=${page}&per_page=${perPage}&sort=updated`);
  }

  async getRepository(owner, repo) {
    return this.makeRequest('GET', `/repos/${owner}/${repo}`);
  }

  async createRepository(name, description, isPrivate = false) {
    return this.makeRequest('POST', '/user/repos', {
      name,
      description,
      private: isPrivate
    });
  }

  async getIssues(owner, repo, state = 'open') {
    return this.makeRequest('GET', `/repos/${owner}/${repo}/issues?state=${state}`);
  }

  async createIssue(owner, repo, title, body, labels = []) {
    return this.makeRequest('POST', `/repos/${owner}/${repo}/issues`, {
      title,
      body,
      labels
    });
  }

  async updateIssue(owner, repo, issueNumber, updates) {
    return this.makeRequest('PATCH', `/repos/${owner}/${repo}/issues/${issueNumber}`, updates);
  }

  async createComment(owner, repo, issueNumber, body) {
    return this.makeRequest('POST', `/repos/${owner}/${repo}/issues/${issueNumber}/comments`, {
      body
    });
  }

  async getNotifications(all = false) {
    return this.makeRequest('GET', `/notifications?all=${all}`);
  }

  async markNotificationAsRead(threadId) {
    return this.makeRequest('PATCH', `/notifications/threads/${threadId}`);
  }

  async getStars() {
    return this.makeRequest('GET', `/users/${this.username}/starred`);
  }

  async starRepository(owner, repo) {
    await axios({
      method: 'PUT',
      url: `${this.apiBase}/user/starred/${owner}/${repo}`,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    return true;
  }

  async getReleases(owner, repo) {
    return this.makeRequest('GET', `/repos/${owner}/${repo}/releases`);
  }

  async createRelease(owner, repo, tagName, name, body, draft = false, prerelease = false) {
    return this.makeRequest('POST', `/repos/${owner}/${repo}/releases`, {
      tag_name: tagName,
      name,
      body,
      draft,
      prerelease
    });
  }

  async getPullRequests(owner, repo, state = 'open') {
    return this.makeRequest('GET', `/repos/${owner}/${repo}/pulls?state=${state}`);
  }

  async createPullRequest(owner, repo, title, body, head, base) {
    return this.makeRequest('POST', `/repos/${owner}/${repo}/pulls`, {
      title,
      body,
      head,
      base
    });
  }

  async getWorkflowRuns(owner, repo) {
    return this.makeRequest('GET', `/repos/${owner}/${repo}/actions/runs`);
  }

  // GitHub "post" would be creating a release or discussion
  async publishPost(post) {
    const repoInfo = post.metadata;

    if (!repoInfo?.owner || !repoInfo?.repo) {
      throw new Error('Repository owner and name required');
    }

    // Create a release as the "post"
    const release = await this.createRelease(
      repoInfo.owner,
      repoInfo.repo,
      post.metadata.tagName || `v${Date.now()}`,
      post.metadata.title || post.content.substring(0, 50),
      post.content
    );

    return {
      id: release.id.toString(),
      url: release.html_url
    };
  }

  async sendMessage() {
    throw new Error('GitHub does not support direct messaging');
  }

  async getAnalytics() {
    const user = await this.getUser();
    const repos = await this.getRepositories();

    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);

    return {
      username: user.login,
      followers: user.followers,
      following: user.following,
      publicRepos: user.public_repos,
      totalStars,
      totalForks,
      contributions: user.contributions || 0
    };
  }

  async getContributionStats(owner, repo) {
    const contributors = await this.makeRequest('GET', `/repos/${owner}/${repo}/stats/contributors`);
    return contributors;
  }

  async searchRepositories(query, sort = 'stars', order = 'desc') {
    return this.makeRequest('GET', `/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&order=${order}`);
  }
}

module.exports = GitHubService;
