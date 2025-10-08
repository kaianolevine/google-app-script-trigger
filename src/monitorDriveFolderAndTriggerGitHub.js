function monitorDriveFolderAndTriggerGitHub(folderId, excludedFiles, checkSubfolders, snapshotPropertyName, repoOwner, repoName, eventType) {
  const props = PropertiesService.getScriptProperties();
  const previousSnapshot = JSON.parse(props.getProperty(snapshotPropertyName) || '{}');
  const currentSnapshot = {};

  let changed = false;

  function traverseFolder(folder) {
    const files = folder.getFiles();
    const subfolders = folder.getFolders();

    // Track files
    while (files.hasNext()) {
      const file = files.next();
      const id = file.getId();
      const name = file.getName();

      // Skip if file is in the exclusion list
      if (excludedFiles.includes(name) || excludedFiles.includes(id)) {
        continue;
      }

      const modTime = file.getLastUpdated().getTime();
      const size = file.getSize();

      currentSnapshot[id] = { type: 'file', name, modTime, size };

      if (
        !previousSnapshot[id] ||
        previousSnapshot[id].modTime !== modTime ||
        previousSnapshot[id].size !== size
      ) {
        changed = true;
      }
    }

    // Track subfolders
    while (subfolders.hasNext()) {
      const sub = subfolders.next();
      const id = sub.getId();
      const name = sub.getName();

      // Skip if folder is in the exclusion list
      if (excludedFiles.includes(name) || excludedFiles.includes(id)) {
        continue;
      }

      currentSnapshot[id] = { type: 'folder', name };

      if (!previousSnapshot[id] || previousSnapshot[id].name !== name) {
        changed = true;
      }

      // Recursively traverse this subfolder only if checkSubfolders is true
      if (checkSubfolders) {
        traverseFolder(sub);
      }
    }
  }

  const rootFolder = DriveApp.getFolderById(folderId);
  traverseFolder(rootFolder);

  // Check for removed items
  for (let id in previousSnapshot) {
    if (!currentSnapshot[id]) changed = true;
  }

  if (changed) {
    const folderName = rootFolder.getName();
    Logger.log(`🟡 Change detected in folder "${folderName}" — triggering GitHub Action...`);
    triggerGitHubAction(repoOwner, repoName, eventType);
    props.setProperty(snapshotPropertyName, JSON.stringify(currentSnapshot));
  } else {
    Logger.log('✅ No changes.');
  }
}