const GITHUB_TOKEN = ''; // create a fine-scoped token
const REPO_OWNER = 'kaianolevine';
const REPO_NAME = 'westie-dj-tools';
const EVENT_TYPE = 'drive-change';

//testing commit here

function monitorDriveFolderAndTriggerGitHub() {
  const folder = DriveApp.getFolderById('');
  const files = folder.getFiles();
  const props = PropertiesService.getScriptProperties();
  const previousSnapshot = JSON.parse(props.getProperty('fileSnapshot') || '{}');
  const currentSnapshot = {};

  let changed = false;

  while (files.hasNext()) {
    const file = files.next();
    const id = file.getId();
    const modTime = file.getLastUpdated().getTime();
    const size = file.getSize();

    currentSnapshot[id] = { modTime, size };

    if (
      !previousSnapshot[id] ||
      previousSnapshot[id].modTime !== modTime ||
      previousSnapshot[id].size !== size
    ) {
      changed = true;
    }
  }

  // Check for removed files
  for (let id in previousSnapshot) {
    if (!currentSnapshot[id]) changed = true;
  }

  if (changed) {
    Logger.log('🟡 Change detected — triggering GitHub Action...');
    triggerGitHubAction();
    props.setProperty('fileSnapshot', JSON.stringify(currentSnapshot));
  } else {
    Logger.log('✅ No changes.');
  }
}

function triggerGitHubAction() {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/dispatches`;

  const payload = {
    event_type: EVENT_TYPE,
    client_payload: { source: "GoogleDrive" }
  };

  const options = {
    method: 'POST',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + GITHUB_TOKEN,
      Accept: 'application/vnd.github+json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  Logger.log(response.getContentText());
}