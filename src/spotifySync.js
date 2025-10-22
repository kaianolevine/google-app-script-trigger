function spotifySync() {
    const REPO_NAME = 'spotify-playlist-generator-dev'; //Github Repo Name
    const EVENT_TYPE = 'spotify_sync'; //event_type for GitHub 'repository_dispatch'
    triggerGitHubAction(REPO_OWNER, REPO_NAME, EVENT_TYPE);
}