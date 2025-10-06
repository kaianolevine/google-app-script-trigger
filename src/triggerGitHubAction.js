function triggerGitHubAction(repoOwner, repoName, eventType) {
  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/dispatches`;

  const payload = {
    event_type: eventType,
    client_payload: { source: "GoogleDrive" }
  };

  const options = {
    method: 'POST',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN'),
      Accept: 'application/vnd.github+json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  Logger.log(response.getContentText());
}