function safeDriveCall(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return fn();
    } catch (e) {
      const msg = e && e.message ? e.message : String(e);
      if (
        msg.includes("We're sorry") ||
        msg.includes("Service error") ||
        msg.includes("FAILED_PRECONDITION")
      ) {
        Logger.log(`⚠️ Transient Drive error (attempt ${i + 1}/${retries}): ${msg}`);
        Utilities.sleep(1000 * Math.pow(2, i));
        continue;
      }
      throw e;
    }
  }
}

function monitorDriveFolderAndTriggerGitHub(folderId, excludedFiles, checkSubfolders, snapshotPropertyName, repoOwner, repoName, eventType) {
  const props = PropertiesService.getScriptProperties();
  const previousSnapshot = JSON.parse(props.getProperty(snapshotPropertyName) || '{}');
  const currentSnapshot = {};

  let changed = false;

  function traverseFolder(folder) {
    const files = safeDriveCall(() => folder.getFiles());
    const subfolders = safeDriveCall(() => folder.getFolders());

    // Track files
    while (files.hasNext()) {
      const file = files.next();
      const id = safeDriveCall(() => file.getId());
      const name = safeDriveCall(() => file.getName());

      // Skip if file is in the exclusion list
      if (excludedFiles.includes(name) || excludedFiles.includes(id)) {
        Utilities.sleep(100);
        continue;
      }

      const modTime = safeDriveCall(() => file.getLastUpdated().getTime());
      const size = safeDriveCall(() => file.getSize());

      currentSnapshot[id] = { type: 'file', name, modTime, size };

      if (
        !previousSnapshot[id] ||
        previousSnapshot[id].modTime !== modTime ||
        previousSnapshot[id].size !== size
      ) {
        changed = true;
      }
      Utilities.sleep(100);
    }

    // Track subfolders
    while (subfolders.hasNext()) {
      const sub = subfolders.next();
      const id = safeDriveCall(() => sub.getId());
      const name = safeDriveCall(() => sub.getName());

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

  let rootFolder;
  try {
    rootFolder = safeDriveCall(() => DriveApp.getFolderById(folderId));
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    if (
      msg.includes("We're sorry") ||
      msg.includes("Service error") ||
      msg.includes("FAILED_PRECONDITION")
    ) {
      Logger.log("⚠️ Transient Drive error — skipping this run.");
      return;
    }
    throw e;
  }

  try {
    traverseFolder(rootFolder);
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    if (msg.includes("We're sorry") || msg.includes("Service error") || msg.includes("FAILED_PRECONDITION")) {
      Logger.log("⚠️ Transient Drive error — skipping this run.");
      return;
    }
    throw e;
  }

  // Check for removed items
  for (let id in previousSnapshot) {
    if (!currentSnapshot[id]) changed = true;
  }

  if (changed) {
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(5000)) {
      Logger.log("⏸️ Skipping run — script already locked.");
      return;
    }
    const folderName = safeDriveCall(() => rootFolder.getName());
    Logger.log(`🟡 Change detected in folder "${folderName}" — triggering GitHub Action...`);
    triggerGitHubAction(repoOwner, repoName, eventType);
    props.setProperty(snapshotPropertyName, JSON.stringify(currentSnapshot));
    lock.releaseLock();
  } else {
    Logger.log('✅ No changes.');
  }
}