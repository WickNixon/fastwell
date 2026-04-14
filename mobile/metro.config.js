const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch only the mobile source tree, not the entire workspace root.
// Root node_modules are referenced for resolution but Metro does not
// need to watch them — they don't hot-reload.
config.watchFolders = [projectRoot];

// Tell the resolver where to find hoisted workspace packages.
config.resolver.nodeModulesPaths = [
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
