function runFloorTrialsProcessor() {
    const REPO_OWNER = 'kaianolevine'; //GitHub Repo Owner
    const REPO_NAME = 'floor-trials-processor'; //Github Repo Name
    const EVENT_TYPE = 'start_floor_trials_processor'; //event_type for GitHub 'repository_dispatch'
    triggerGitHubAction(REPO_OWNER, REPO_NAME, EVENT_TYPE);
}
