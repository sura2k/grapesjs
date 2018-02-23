var Backbone = require('backbone');
const Selector = require('./../model/Selector');

module.exports = Backbone.View.extend({
  template: _.template(`
  <span id="<%= pfx %>checkbox" class="fa"></span>
  <span id="<%= pfx %>tag-label">
      <input class="<%= ppfx %>no-app" value="<%= label %>" title="<%= label %>" <%= inputProp %>/>
  </span>
  <span id="<%= pfx %>close">&Cross;</span>`),

  initialize(o) {
    this.config = o.config || {};
    this.coll = o.coll || null;
    this.pfx = this.config.stylePrefix || '';
    this.ppfx = this.config.pStylePrefix || '';
    this.inputProp = 'readonly';
    this.target = this.config.em;
    this.closeId = this.pfx + 'close';
    this.chkId = this.pfx + 'checkbox';
    this.labelId = this.pfx + 'tag-label';
    this.events = {};
    this.events['click #' + this.closeId ] = 'removeTag';
    this.events['click #' + this.chkId ] = 'changeStatus';
    this.events['dblclick #' + this.labelId ] = 'startEditTag';
    this.events['keypress #' + this.labelId + ' input'] = 'updateInputLabel';
    this.events['blur #' + this.labelId + ' input'] = 'endEditTag';

    this.listenTo( this.model, 'change:active', this.updateStatus);
    this.delegateEvents();
  },

  /**
   * Start editing tag
   * @private
   */
  startEditTag() {
    this.$labelInput.prop(this.inputProp, false);
  },

  /**
   * End editing tag. If the class typed already exists the
   * old one will be restored otherwise will be changed
   * @private
   */
  endEditTag() {
    var value = this.$labelInput.val();
    var next = Selector.escapeName(value);

    if(this.target){
      var clsm = this.target.get('SelectorManager');

      if(clsm){
        if(clsm.get(next))
          this.$labelInput.val(this.model.get('label'));
        else
          this.model.set({ name: next, label: value});
      }
    }
    this.$labelInput.prop(this.inputProp, true);
  },

  /**
   * Update status of the tag
   * @private
   */
  changeStatus() {
    this.model.set('active', !this.model.get('active'));
	if(this.config.isAdvanceMode){
		this.model.set('activeAdvance', this.model.get('active'));
		
		var activeFound = false;
		this.coll.each(function(model){
			var activeAdvance = model.get('active') || false;
			if(activeAdvance){
				activeFound = true;
				return;
			}
		},this);
		
		this.toggelSelectorsArea(activeFound);
	}
    this.target.trigger('targetClassUpdated');
  },

  /**
* Remove tag from the selected component
   * @param {Object} e
   * @private
   */
  removeTag(e) {
	if(this.config.isAdvanceMode){
		this.removeTagsInAdvanceMode();
		return;
	}
	const em = this.target;
    const model = this.model;
    const coll = this.coll;
    const el = this.el;
    const sel = em && em.get('selectedComponent');
    sel && sel.get & sel.get('classes').remove(model);
    coll && coll.remove(model);
    setTimeout(() => this.remove(), 0);
    em && em.trigger('targetClassRemoved');
  },
  
  /**
   * Remove tags/classes/groups in advance mode, item or all items
   * @private
   */
  removeTagsInAdvanceMode() {
	var mdlClass = this.ppfx+'mdl-dialog-sm'; //gjs-mdl-dialog-sm
    var groupDelMdlContainer = document.getElementById('group-del-panel');
	if(!groupDelMdlContainer){
		var groupDelMdlContainer = document.createElement('div');
		groupDelMdlContainer.style.display = "none";
		groupDelMdlContainer.setAttribute('id', 'group-del-panel');
		groupDelMdlContainer.innerHTML = 
				'<div id="group-del-panel-op" op="false">' +
					'<span id="'+this.ppfx+'mdl-btn-item" class="'+this.ppfx+'custom-btn-style">From Current Item</span>'+
					'<span id="'+this.ppfx+'mdl-btn-group" class="'+this.ppfx+'custom-btn-style">From All Items</span>'+
				'</div>';
	}else{
		document.getElementById('group-del-panel-op').setAttribute('op', 'false');
	}
	var mdlDialog = document.querySelector('.'+this.ppfx+'mdl-dialog'); //.gjs-mdl-dialog
    mdlDialog.className += ' ' + mdlClass;
    groupDelMdlContainer.style.display = 'block';
	var modal = editor.Modal;
    modal.setTitle('Remove Group Style');
    modal.setContent(groupDelMdlContainer);
    modal.open();
	
	var removeClassFromAll = function(components, model, init = true){
		var processed = 0;
		var removed = 0;
		if(init){
			for(var i=0; i<components.length; i++){
				var comp = components[i];
				if(comp){
					if(comp.classes.remove(model)){
						removed++;
					}
					processed++;
					var ret = removeClassFromAll(comp.components, model, false);
					processed += ret[0];
					removed += ret[1];
				}
			}
		}else{
			components && components.each(function(comp){
				if(comp){
					if(comp.get('classes').remove(model)){
						removed++;
					}
					processed++;
					var ret = removeClassFromAll(comp.get('components'), model, false);
					processed += ret[0];
					removed += ret[1];
				}
			});
		}
		
		return [processed, removed];
	};
	
	var THAT = this;
	document.getElementById(this.ppfx+'mdl-btn-item').onclick = function(){
		const em = THAT.target;
		const model = THAT.model;
		const coll = THAT.coll;
		const el = THAT.el;
		const sel = em && em.get('selectedComponent');
		sel && sel.get & sel.get('classes').remove(model);
		coll && coll.remove(model);
		setTimeout(() => THAT.remove(), 0);
		em && em.trigger('targetClassRemoved');
		
		modal.close();
	};
	
	document.getElementById(this.ppfx+'mdl-btn-group').onclick = function(){
		const em = THAT.target;
		const model = THAT.model;
		const coll = THAT.coll;
		const el = THAT.el;
		const comps = em && em.getComponents();
		var ret = removeClassFromAll(comps, model);
			console.log("removed: "+ret[1]+", processed: "+ret[0]);
		coll && coll.remove(model);
		setTimeout(() => THAT.remove(), 0);
		em && em.trigger('targetClassRemoved');
		
		modal.close();
	};
	
    modal.getModel().once('change:open', function() {
          mdlDialog.className = mdlDialog.className.replace(mdlClass, '');
    });
  },

  /**
   * Update status of the checkbox
   * @private
   */
  updateStatus() {
    var chkOn = 'fa-check-square-o';
    var chkOff = 'fa-square-o';

    if(!this.$chk)
      this.$chk = this.$el.find('#' + this.pfx + 'checkbox');

    if(this.model.get('active')){
      this.$chk.removeClass(chkOff).addClass(chkOn);
      this.$el.removeClass('opac50');
    }else{
      this.$chk.removeClass(chkOn).addClass(chkOff);
      this.$el.addClass('opac50');
    }
  },

  /**
   * Update label's input
   * @private
   */
  updateInputLabel() {
    if(!this.$labelInput) {
      this.$labelInput = this.$el.find('input');
    }

    this.$labelInput.prop(this.inputProp, true);
    var size = this.$labelInput.val().length - 1;
    size = size < 1 ? 1 : size;
    this.$labelInput.attr('size', size);
  },


  render() {
    const pfx = this.pfx;
    const ppfx = this.ppfx;
    this.$el.html( this.template({
      label: this.model.get('label'),
      pfx,
      ppfx,
      inputProp: this.inputProp,
    }));
    this.$el.attr('class', `${pfx}tag ${ppfx}three-bg`);
    this.updateStatus();
    this.updateInputLabel();
    return this;
  },

  //-------------------------------------------------------------//
  //---------------Advance Mode Functions------------------------//
  //-------------------------------------------------------------//
  
  toggelSelectorsArea(show){
	//gjs-sm-sectors
	if(show){
		document.getElementById(this.ppfx+"sm-sectors").style.display = "block";
	}else{
		document.getElementById(this.ppfx+"sm-sectors").style.display = "none";
	}
  },

});
