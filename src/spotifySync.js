function spotifySync() {
    const REPO_OWNER = 'kaianolevine'; //GitHub Repo Owner
    const REPO_NAME = 'spotify-playlist-generator-dev'; //Github Repo Name
    const EVENT_TYPE = 'GoogleAppScript_SpotifySync'; //event_type for GitHub 'repository_dispatch'
    triggerGitHubAction(REPO_OWNER, REPO_NAME, EVENT_TYPE);
}
