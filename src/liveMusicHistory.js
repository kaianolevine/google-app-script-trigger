function vdjMusicHistory() {
    monitorDriveFolderAndTriggerGitHub(
        '1FzuuO3xmL2n-8pZ_B-FyrvGWaLxLED3o', //FOLDER_ID
        'vdjHistorySnapshot', //Unique Snapshot Property Name
        'kaianolevine', //GitHub Repo Owner
        'combined-tools-sandbox', //Github Repo Name
        'vdj_history'); //event_type for GitHub 'repository_dispatch'
}