chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
  	id: "var-nerd-project-list",
    innerBounds: {
      maxWidth: 350,
      maxHeight: 415
    },
    "resizable": false
  });
});
