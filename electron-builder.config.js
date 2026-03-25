module.exports = {
  appId: 'com.gvenzl.sysmonitor',
  productName: 'SysMonitor',
  directories: {
    buildResources: 'build'
  },
  mac: {
    target: ['dmg', 'zip'],
    notarize: !!process.env.CSC_LINK
  },
  linux: {
    icon: 'assets/icons/SysMonitor.png'
  },
  win: {
    icon: 'assets/icons/favicon.ico'
  }
};
