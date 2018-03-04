var Backbone = require('backbone');

module.exports = Backbone.Model.extend({
  defaults: {
    command: '',
    attributes: {},
    //1. DO OVERRIDE VIA PLUGIN
    //-----TEST (SELECT_IN_TOOLBAR)-----//
    //events and content and defaults of parent, but this hasn't used super defaults. Therefore has to add following to manually
    //attributes are available, but it only does adding properties to component, but no way of adding child or innerHTML
    //Can do this in your own plugin, if you can extends ToolbarButtonView, at this point ToolbarButtonView is not exposed
    events: {},
    custom: {}
    //End-----TEST (SELECT_IN_TOOLBAR)-----//
  }
});
