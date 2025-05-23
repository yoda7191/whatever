const chokidar = require('chokidar');
const fs = require('fs').promises;
const path = require('path');

class ContextManager {
  constructor() {
    this.context = '';
    this.watcher = null;
  }

  async initialize(workspacePath) {
    this.workspacePath = workspacePath;
    await this.scanWorkspace();
    this.setupFileWatcher();
  }

  async scanWorkspace() {
    const files = await this.listCodeFiles(this.workspacePath);
    this.context = await this.readFilesContents(files);
  }

  setupFileWatcher() {
    this.watcher = chokidar.watch(this.workspacePath, {
      ignored: /(^|[/\\])\../,
      persistent: true,
      ignoreInitial: true
    });

    this.watcher
      .on('add', this.handleFileChange.bind(this))
      .on('change', this.handleFileChange.bind(this))
      .on('unlink', this.handleFileRemove.bind(this));
  }

  async handleFileChange(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      this.context += `\nFILE: ${path.relative(this.workspacePath, filePath)}\n${content}\n`;
    } catch (error) {
      console.error('Error reading file:', error);
    }
  }

  handleFileRemove(filePath) {
    const relPath = path.relative(this.workspacePath, filePath);
    this.context = this.context.replace(new RegExp(`FILE: ${relPath}.*?\n`, 'gs'), '');
  }

  async listCodeFiles(dir) {
    // Implement directory traversal with file type filtering
  }

  async readFilesContents(files) {
    // Implement reading and concatenating file contents
  }

  getContext() {
    return this.context;
  }
}

module.exports = { ContextManager };