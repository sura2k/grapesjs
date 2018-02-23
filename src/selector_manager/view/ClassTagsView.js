var Backbone = require('backbone');
var ClassTagView = require('./ClassTagView');

var ClassTagsView = Backbone.View.extend({
  template: _.template(`
  <div id="<%= pfx %>up">
    <div id="<%= pfx %>label"><%= label %></div>
    <div id="<%= pfx %>status-c">
      <span id="<%= pfx %>input-c">
        <div class="<%= ppfx %>field <%= ppfx %>select">
          <span id="<%= ppfx %>input-holder">
            <select id="<%= pfx %>states">
              <option value=""><%= statesLabel %></option>
            </select>
          </span>
          <div class="<%= ppfx %>sel-arrow">
            <div class="<%= ppfx %>d-s-arrow"></div>
          </div>
        </div>
      </span>
    </div>
  </div>
  <div id="<%= pfx %>tags-field" class="<%= ppfx %>field">
    <div id="<%= pfx %>tags-c"></div>
    <input id="<%= pfx %>new" />
    <span id="<%= pfx %>add-tag" class="fa fa-plus"></span>
  </div>
  <div id="<%= pfx %>sel-help">
    <div id="<%= pfx %>label"><%= selectedLabel %></div>
    <div id="<%= pfx %>sel"></div>
    <div style="clear:both"></div>
  </div>`),
  
  templateAdvanceMode: _.template(`
  <!--appliesto selection-->
  <div id="<%= pfx %>appliesto">
    <div id="<%= pfx %>appliesto-label"><%= advanceMode.appliestoLabel %></div>
    <div id="<%= pfx %>appliesto-status">
      <span id="<%= pfx %>input-appliesto">
        <div class="<%= ppfx %>field <%= ppfx %>select">
          <span id="<%= ppfx %>appliesto-input-holder" style="padding-right: 10px;">
            <select id="<%= pfx %>appliesto-states">
            </select>
          </span>
          <div class="<%= ppfx %>sel-arrow">
            <div class="<%= ppfx %>d-s-arrow"></div>
          </div>
        </div>
      </span>
    </div>
  </div>
  <!--ends appliesto selection-->
  <div id="<%= pfx %>up" style="clear:both; <%= advanceMode.defaultBehaviour %>">
    <div id="<%= pfx %>label"><%= label %></div>
    <div id="<%= pfx %>status-c">
      <span id="<%= pfx %>input-c">
        <div class="<%= ppfx %>field <%= ppfx %>select">
          <span id="<%= ppfx %>input-holder">
            <select id="<%= pfx %>states">
              <option value=""><%= statesLabel %></option>
            </select>
          </span>
          <div class="<%= ppfx %>sel-arrow">
            <div class="<%= ppfx %>d-s-arrow"></div>
          </div>
        </div>
      </span>
    </div>
  </div>
  <!-- style clear section -->
  <div id="<%= pfx %>reset-item-style-holder" style="clear:both; margin-top: 36px; margin-bottom: 10px">
    <span id="<%= pfx %>reset-item-style" class="<%= ppfx %>custom-btn-style"><%= advanceMode.resetItemStylesLabel %></span>
  </div>
  <!-- ends style clear section -->
  <!--class tags section-->
  <div id="<%= pfx %>tags-field" class="<%= ppfx %>field" style="clear:both;">
    <div id="<%= pfx %>tags-c"></div>
    <input id="<%= pfx %>new"/>
    <span id="<%= pfx %>add-tag" class="fa fa-plus"></span>
  </div>
  <!--ends class tags section-->
  <!--class selector info-->
  <div id="<%= pfx %>sel-help" style="clear:both;">
    <div id="<%= pfx %>label"><%= selectedLabel %></div>
    <div id="<%= pfx %>sel"></div>
    <div style="clear:both"></div>
  </div>`),

  events: {},

  initialize(o = {}) {
    this.config = o.config || {};
    this.pfx = this.config.stylePrefix || '';
    this.ppfx = this.config.pStylePrefix || '';
    this.className = this.pfx + 'tags';
    this.addBtnId = this.pfx + 'add-tag';
    this.newInputId = this.pfx + 'new';
    this.stateInputId = this.pfx + 'states';
    this.stateInputC = this.pfx + 'input-c';
    this.states = this.config.states || [];
    this.events['click #' + this.addBtnId] = 'startNewTag';
    this.events['blur #' + this.newInputId] = 'endNewTag';
    this.events['keyup #' + this.newInputId] = 'onInputKeyUp';
    this.events['change #' + this.stateInputId] = 'stateChanged';

    this.target = this.config.em;
    this.em = this.target;

    this.listenTo(this.target ,'change:selectedComponent',this.componentChanged);
    this.listenTo(this.target, 'targetClassUpdated', this.updateSelector);

    this.listenTo(this.collection, 'add', this.addNew);
    this.listenTo(this.collection, 'reset', this.renderClasses);
    this.listenTo(this.collection, 'remove', this.tagRemoved);
	
	if(this.isAdvanceModeValid()){
		this.resetStyleBtnContainer = this.pfx + 'reset-item-style-holder';
		this.customGroupContainer = this.pfx + 'tags-field';
		
		this.appliestoStateInputId = this.pfx + 'appliesto-states';
		this.appliestoStates = [
							{name:'item', label: this.config.advanceMode.appliestoOptionItemLabel}, 
							{name:'customgroup', label: this.config.advanceMode.appliestoOptionCustomGroupLabel}
							] || [];
		this.events['change #' + this.appliestoStateInputId] = 'appliestoStateChanged';
		this.resetItemStyleBtnId = this.pfx + 'reset-item-style';
		this.events['click #' + this.resetItemStyleBtnId] = 'resetItemStyle';
		
		//Listen to component:add event to modify default classes
		//Better to move the logic somewhere else more preferable, but added here to stick with minimum code changes to core
		if(!ClassTagsView.compAddEventListened){
			this.em.on('component:add', this.disableAccessToDefaultClasses_OnCompAdd, this);
			ClassTagsView.compAddEventListened = true;
		}
		this.disableAccessToDefaultClasses_OnInit();
	}

    this.delegateEvents();
  },

  /**
   * Triggered when a tag is removed from collection
   * @param {Object} model Removed model
   * @private
   */
  tagRemoved(model) {
    this.updateStateVis();
  },

  /**
   * Create select input with states
   * @return {string} String of options
   * @private
   */
  getStateOptions() {
    var strInput = '';
    for(var i = 0; i < this.states.length; i++){
      strInput += '<option value="' + this.states[i].name + '">' + this.states[i].label + '</option>';
    }
    return strInput;
  },

  /**
   * Add new model
   * @param {Object} model
   * @private
   */
  addNew(model) {
    this.addToClasses(model);
  },

  /**
   * Start tag creation
   * @param {Object} e
   * @private
   */
  startNewTag(e) {
    this.$addBtn.get(0).style.display = 'none';
    this.$input.show().focus();
  },

  /**
   * End tag creation
   * @param {Object} e
   * @private
   */
  endNewTag(e) {
    this.$addBtn.get(0).style.display = '';
    this.$input.hide().val('');
  },

  /**
   * Checks what to do on keyup event
   * @param  {Object} e
   * @private
   */
  onInputKeyUp(e) {
    if (e.keyCode === 13)
      this.addNewTag(this.$input.val());
    else if(e.keyCode === 27)
      this.endNewTag();
  },

  /**
   * Triggered when component is changed
   * @param  {Object} e
   * @private
   */
  componentChanged(e) {
    this.compTarget = this.target.get('selectedComponent');
	if(this.config.isAdvanceMode){
		this.fireAppliestoStateChangeEvent(); //fire applies to state selection
	}
    const target = this.compTarget;
    let validSelectors = [];

    if (target) {
      this.getStates().val(target.get('state'));
      validSelectors = target.get('classes').getValid();
    }

    this.collection.reset(validSelectors);
    this.updateStateVis();
  },

  /**
   * Update states visibility. Hides states in case there is no tags
   * inside collection
   * @private
   */
  updateStateVis() {
    const em = this.em;
    const avoidInline = em && em.getConfig('avoidInlineStyle');

    if(this.collection.length || avoidInline)
      this.getStatesC().css('display','block');
    else
      this.getStatesC().css('display','none');
    this.updateSelector();
  },


  /**
   * Udpate selector helper
   * @return {this}
   * @private
   */
  updateSelector() {
    if(this.config.isAdvanceMode){
		this.updateSelectorAdvanceMode();
		return;
    }
    const selected = this.target.getSelected();
    this.compTarget = selected;

    if (!selected || !selected.get) {
      return;
    }

    const state = selected.get('state');
    let result = this.collection.getFullString();
    result = result || `#${selected.getId()}`;
    result += state ? `:${state}` : '';
    const el = this.el.querySelector('#' + this.pfx + 'sel');
    el && (el.innerHTML = result);
  },


  /**
   * Triggered when the select with states is changed
   * @param  {Object} e
   * @private
   */
  stateChanged(e) {
    if(this.compTarget){
      this.compTarget.set('state', this.$states.val());
      if(this.target)
        this.target.trigger('targetStateUpdated');
      this.updateSelector();
    }
  },

  /**
   * Add new tag to collection, if possible, and to the component
   * @param  {Object} e
   * @private
   */
  addNewTag(label) {
    const target = this.target;
    const component = this.compTarget;

    if (!label.trim()) {
      return;
    }

    if (target) {
      const sm = target.get('SelectorManager');
      var model = sm.add({label});
	  
	  if(this.config.isAdvanceMode){
		model.set('active', true);  
		model.set('activeAdvance', true);
		this.toggelSelectorsArea(true);
	  }
	  
      if (component) {
        var compCls = component.get('classes');
        var lenB = compCls.length;
        compCls.add(model);
        var lenA = compCls.length;
        this.collection.add(model);

        if (lenA > lenB) {
          target.trigger('targetClassAdded');
        }

        this.updateStateVis();
      }
    }
    this.endNewTag();
  },

  /**
   * Add new object to collection
   * @param   {Object} model  Model
   * @param   {Object} fragmentEl   Fragment collection
   * @return {Object} Object created
   * @private
   * */
  addToClasses(model, fragmentEl) {
    var fragment  = fragmentEl || null;

    var view = new ClassTagView({
        model,
        config: this.config,
        coll: this.collection,
    });
    var rendered  = view.render().el;

    if(fragment)
      fragment.appendChild(rendered);
    else
      this.getClasses().append(rendered);

    return rendered;
  },

  /**
   * Render the collection of classes
   * @return {this}
   * @private
   */
  renderClasses() {
    var fragment = document.createDocumentFragment();

    this.collection.each(function(model){
      this.addToClasses(model, fragment);
    },this);

    if(this.getClasses())
      this.getClasses().empty().append(fragment);

    return this;
  },

  /**
   * Return classes element
   * @return {HTMLElement}
   * @private
   */
  getClasses() {
    if(!this.$classes)
      this.$classes = this.$el.find('#' + this.pfx + 'tags-c');
    return this.$classes;
  },

  /**
   * Return states element
   * @return {HTMLElement}
   * @private
   */
  getStates() {
    if(!this.$states)
      this.$states = this.$el.find('#' + this.stateInputId);
    return this.$states;
  },

  /**
   * Return states container element
   * @return {HTMLElement}
   * @private
   */
  getStatesC() {
    if(!this.$statesC)
      this.$statesC = this.$el.find('#' + this.stateInputC);
    return this.$statesC;
  },

  render() {
	if(this.config.isAdvanceMode){
		return this.renderAdvanceMode();
	}
    const config = this.config;
    this.$el.html(this.template({
      selectedLabel: config.selectedLabel,
      statesLabel: config.statesLabel,
      label: config.label,
      pfx: this.pfx,
      ppfx: this.ppfx,
    }));
    this.$input = this.$el.find('input#' + this.newInputId);
    this.$addBtn = this.$el.find('#' + this.addBtnId);
    this.$classes = this.$el.find('#' + this.pfx + 'tags-c');
    this.$states = this.$el.find('#' + this.stateInputId);
    this.$statesC = this.$el.find('#' + this.stateInputC);
    this.$states.append(this.getStateOptions());
    this.renderClasses();
    this.$el.attr('class', this.className);
    return this;
  },
  
  //-------------------------------------------------------------//
  //---------------Advance Mode Functions------------------------//
  //-------------------------------------------------------------//
  
  getAppliestoStateOptions() {
    var strInput = '';
    for(var i = 0; i < this.appliestoStates.length; i++){
      strInput += '<option value="' + this.appliestoStates[i].name + '">' + this.appliestoStates[i].label + '</option>';
    }
    return strInput;
  },
	  
  fireAppliestoStateChangeEvent(){
	var appliesto = document.getElementById(this.appliestoStateInputId);
	if(appliesto){//test fails otherwise
		appliesto.value = "item";
		try{
			console.log('Non IE - appliesto firing..');
			appliesto.dispatchEvent(new Event('change', {'bubbles': true }));
			console.log('Non IE - appliesto fired manually');
		}catch(e){//IE 11
			console.log('IE - appliesto firing...');
			var event = document.createEvent('Event');
			event.initEvent('change', true, true); 
			// args: string type, boolean bubbles, boolean cancelable
			appliesto.dispatchEvent(event);
			console.log('IE - appliesto fired...');
		}
		this.toggelSelectorsArea(true);
	}
  },

  appliestoStateChanged(e) {
	console.log('appliesto select-option changed/fired');
    if(this.compTarget){
	  let selectedVal = this.$appliestoStates.val();
      this.compTarget.set('appliestoState', selectedVal);
	  
	  let selFound = true;
	  let isItem;
      if(selectedVal === 'item'){
		  isItem = true;
	  }else if(selectedVal === "customgroup"){
		  isItem = false;
	  }else{
		  selFound = false;
	  }
	  
	  if(selFound){
		var showSelectorArea = false;
		
		if(isItem){
			this.collection.each(function(model){
				model.set('active', false);
			},this);
			this.toggelSelectorsArea(true);
			showSelectorArea = true;
		}else{
			var activeFound = false;
			this.collection.each(function(model){
				var activeAdvance = model.get('activeAdvance') || false;
				model.set('active', activeAdvance);
				if(activeAdvance){
					activeFound = true;
				}
			},this);
			showSelectorArea = activeFound;
		}
		
		if(isItem){
			document.getElementById(this.resetStyleBtnContainer).style.display = "block";
			document.getElementById(this.customGroupContainer).style.display = "none";
		}else{
			document.getElementById(this.resetStyleBtnContainer).style.display = "none";
			document.getElementById(this.customGroupContainer).style.display = "block";
		}
		
		document.getElementById(this.stateInputId).value = "";
		
		this.toggelSelectorsArea(showSelectorArea);
		this.target.trigger('targetClassUpdated');
	  }
    }
  },
	  
  toggelSelectorsArea(show){
	//gjs-sm-sectors
	if(show){
		document.getElementById(this.ppfx+"sm-sectors").style.display = "block";
	}else{
		document.getElementById(this.ppfx+"sm-sectors").style.display = "none";
	}
  },

  resetItemStyle(e) {
	const component = this.compTarget;
	component.setStyle({}, {});
	this.target.trigger('targetClassUpdated');
  },
	  
  //NOT_IN_USE
  //Planned to Call fom componentChanged() just after initializing this.compTarget
  preserveDefaultsAndProvideDuplicateClasses_OnCompChange() {
	let utSuffix = "-ag";
	
	const target = this.target;
    const component = this.compTarget;
	
	let nonUserTypePublicClasses = [];
	if(component){
		const classes = component.get('classes');
		classes.each(function (model) {
		  let claz = model.get('name');
		  if(claz && !claz.endsWith(utSuffix)){
			model.set('private', true);
			nonUserTypePublicClasses.push(claz);
		  }
		});
		
		if(target){
			const sm = target.get('SelectorManager');
			nonUserTypePublicClasses.forEach(function(claz){
				const label = claz + utSuffix;
				var model = sm.add({label});
				component.get('classes').add(model);
			});
			target.trigger('targetClassAdded');
		}
	}
  },
  
  //NOT_IN_USE
  preserveDefaultsAndProvideDuplicateClasses_OnCompAdd(component) {
	let suffix = "-ag";
	this.preserveDefaultsAndAndProvideDuplicates(this.target, component, suffix);
  },
  
  //NOT_IN_USE
  preserveDefaultsAndAndProvideDuplicates(target, component, suffix){
	if(!component || !target){
		return;
	}
	
	//if component
	let nonUserTypePublicClasses = [];
	const classes = component.get('classes');
	classes.each(function (model) {
	  let claz = model.get('name');
	  if(claz && !claz.endsWith(suffix)){
		model.set('private', true);
		nonUserTypePublicClasses.push(claz);
	  }
	});
	
	//if component && target
	const sm = target.get('SelectorManager');
	nonUserTypePublicClasses.forEach(function(claz){
		const label = claz + suffix;
		var model = sm.add({label});
		component.get('classes').add(model);
	});
	
	//if component && target
	let childComponents = component.get('components');
	var that = this;
	childComponents.each(function (child){
		that.preserveDefaultsAndAndProvideDuplicates(target, child, suffix);
	});
	
  },

  disableAccessToDefaultClasses_OnInit() {
	const components = this.em && this.em.getComponents();
	if(!components){
		return;
	}
	var dummyRootComponent = {
		get: function(attr){
			if(attr==='components'){
				return new Backbone.Collection(components);
			}
			return new Backbone.Collection([]);
		}
	}
	this.disableAccessToDefaultClasses(dummyRootComponent);
  },
  
  disableAccessToDefaultClasses_OnCompAdd(component) {
	this.disableAccessToDefaultClasses(component);
  },
	  
  disableAccessToDefaultClasses(component){
	if(!component){
		return;
	}
	
	const classes = component.get('classes');
	classes.each(function (model) {
		model.set('private', true);
	});
	
	let childComponents = component.get('components');
	var that = this;
	childComponents.each(function (child){
		that.disableAccessToDefaultClasses(child);
	});
	
  },
	  
  updateSelectorAdvanceMode() {
    const selected = this.target.getSelected();
    this.compTarget = selected;

    if (!selected || !selected.get) {
      return;
    }
	
	var appliesto = document.getElementById(this.appliestoStateInputId);

    const state = selected.get('state');
    let result = "";
	if(appliesto.value === "item"){
		result = `#${selected.getId()}`;
		result += state ? `:${state}` : '';
	}else{
		result = this.collection.getActiveString();
		if(result){
			result += state ? `:${state}` : '';
		}else{
			result = "None!";
		}
	}
    const el = this.el.querySelector('#' + this.pfx + 'sel');
    el && (el.innerHTML = result);
  },
	  
  isAdvanceModeValid(){
	  const config = this.config;
	  
	  if(!config || !config.advanceMode || !config.advanceMode.enable){
		  config.isAdvanceMode = false;
		  return false;
	  }
	  const adv = config.advanceMode;
	  if(!adv.appliestoLabel || 
		 !adv.appliestoOptionItemLabel || 
		 !adv.appliestoOptionCustomGroupLabel || 
		 !adv.resetItemStylesLabel || 
		 !adv.removeCustomGroupDialogTitle || 
		 !adv.removeCustomGroupFromSelectedItemLable || 
		 !adv.removeCustomGroupFromAllItemLable){
			config.isAdvanceMode = false;
			return false;
	  }
	  
	  if(adv.behaviourLabel){
		 config.label = config.advanceMode.behaviourLabel;
	  }
	  if(adv.behaviourStatesDefaultOptionLabel){
		 config.statesLabel = config.advanceMode.behaviourStatesDefaultOptionLabel;
	  }
	  
	  if(adv.defaultBehaviourOnly === true){
		 config.advanceMode.defaultBehaviour = "display:none;";
	  }else{
		 config.advanceMode.defaultBehaviour = "display:block;";
	  }
	  
	  config.isAdvanceMode = true;
	  return true;
  },
  
  renderAdvanceMode() {
    const config = this.config;
    this.$el.html(this.templateAdvanceMode({
      selectedLabel: config.selectedLabel,
      statesLabel: config.statesLabel,
      label: config.label,
	  advanceMode: config.advanceMode,
      pfx: this.pfx,
      ppfx: this.ppfx,
    }));
    this.$input = this.$el.find('input#' + this.newInputId);
    this.$addBtn = this.$el.find('#' + this.addBtnId);
    this.$classes = this.$el.find('#' + this.pfx + 'tags-c');
    this.$states = this.$el.find('#' + this.stateInputId);
    this.$statesC = this.$el.find('#' + this.stateInputC);
	if(!config.advanceMode.defaultBehaviourOnly){
		this.$states.append(this.getStateOptions());
    }
	this.$appliestoStates = this.$el.find('#' + this.appliestoStateInputId);
	this.$appliestoStates.append(this.getAppliestoStateOptions());
    this.renderClasses();
    this.$el.attr('class', this.className);
    return this;
  },

},
{
	//static
	//initialize() called twice and some other module might be using it for some other reason
	//hence restrcited to single event callback
	compAddEventListened: false,
});

module.exports = ClassTagsView;
