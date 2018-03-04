var Backbone = require('backbone');

module.exports = Backbone.View.extend({
  events() {
    return (
      this.model.get('events') || {
        mousedown: 'handleClick'
      }
    );
  },

  attributes() {
    return this.model.get('attributes');
  },

  initialize(opts) {
    this.editor = opts.config.editor;
  },

  handleClick(event) {
    event.preventDefault();
    event.stopPropagation();
    this.execCommand(event);
  },

  execCommand(event) {
    const opts = { event };
    const command = this.model.get('command');
    const editor = this.editor;

    if (typeof command === 'function') {
      command(editor, null, opts);
    }

    if (typeof command === 'string') {
      editor.runCommand(command, opts);
    }
  },

  //2. DO OVERIDE VIA PLUGIN
  render() {
    var config = this.editor.getConfig();
    this.el.className += ' ' + config.stylePrefix + 'toolbar-item';
    //-----TEST (SELECT_IN_TOOLBAR)-----//
    //Can do this in your own plugin, if you can extends ToolbarButtonView, at this point ToolbarButtonView is not exposed
    //How: call the super, do not return,the do the following and then return
    const custom = this.model.get('custom');
    if (custom && custom.render) {
      this.el.style.display = 'inline';
      this.el.innerHTML = custom.render();
    }
    //End-----TEST (SELECT_IN_TOOLBAR)-----//
    return this;
  }
});
